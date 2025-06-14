import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { createChart, ColorType, IChartApi, ISeriesApi, LineData, CandlestickData } from 'lightweight-charts';
import { TrendingUp, TrendingDown, Clock, Zap } from 'lucide-react';

interface PriceChartProps {
  symbol: string;
  timeframe?: string;
  height?: number;
}

const PriceChart: React.FC<PriceChartProps> = ({ 
  symbol, 
  timeframe = '1D',
  height = 300
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [chart, setChart] = useState<IChartApi | null>(null);
  const [series, setSeries] = useState<ISeriesApi<"Candlestick"> | null>(null);
  const [volumeSeries, setVolumeSeries] = useState<ISeriesApi<"Histogram"> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [priceData, setPriceData] = useState<{
    currentPrice: number;
    change24h: number;
    high24h: number;
    low24h: number;
  }>({
    currentPrice: 0,
    change24h: 0,
    high24h: 0,
    low24h: 0
  });

  useEffect(() => {
    if (!chartContainerRef.current) return;
    
    // Clear previous chart
    if (chart) {
      chart.remove();
    }
    
    // Create new chart
    const newChart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: height,
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#d1d5db',
      },
      grid: {
        vertLines: { color: 'rgba(42, 46, 57, 0.2)' },
        horzLines: { color: 'rgba(42, 46, 57, 0.2)' },
      },
      timeScale: {
        borderColor: 'rgba(42, 46, 57, 0.5)',
        timeVisible: true,
      },
      crosshair: {
        mode: 0,
      },
      rightPriceScale: {
        borderColor: 'rgba(42, 46, 57, 0.5)',
      },
    });
    
    // Add candlestick series
    const newSeries = newChart.addCandlestickSeries({
      upColor: '#10b981',
      downColor: '#ef4444',
      borderUpColor: '#10b981',
      borderDownColor: '#ef4444',
      wickUpColor: '#10b981',
      wickDownColor: '#ef4444',
    });
    
    // Add volume series
    const newVolumeSeries = newChart.addHistogramSeries({
      color: '#3b82f6',
      priceFormat: {
        type: 'volume',
      },
      priceScaleId: '',
      scaleMargins: {
        top: 0.8,
        bottom: 0,
      },
    });
    
    setChart(newChart);
    setSeries(newSeries);
    setVolumeSeries(newVolumeSeries);
    
    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current && newChart) {
        newChart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      if (newChart) {
        newChart.remove();
      }
    };
  }, []);

  useEffect(() => {
    if (!series || !volumeSeries) return;
    
    // Generate mock data based on symbol and timeframe
    setIsLoading(true);
    
    // Parse symbol
    const [baseToken, quoteToken] = symbol.split('/');
    
    // Generate data
    setTimeout(() => {
      const data = generateMockData(baseToken, quoteToken, timeframe);
      series.setData(data.candles);
      volumeSeries.setData(data.volumes);
      
      // Update price data
      const lastCandle = data.candles[data.candles.length - 1];
      const firstCandle = data.candles[0];
      const highCandle = data.candles.reduce((prev, current) => (prev.high > current.high) ? prev : current);
      const lowCandle = data.candles.reduce((prev, current) => (prev.low < current.low) ? prev : current);
      
      setPriceData({
        currentPrice: lastCandle.close,
        change24h: ((lastCandle.close - firstCandle.open) / firstCandle.open) * 100,
        high24h: highCandle.high,
        low24h: lowCandle.low
      });
      
      setIsLoading(false);
    }, 500);
  }, [series, volumeSeries, symbol, timeframe]);

  const generateMockData = (baseToken: string, quoteToken: string, timeframe: string) => {
    // Set base price based on token pair
    let basePrice = 0.000173; // Default for ALT/WATT
    
    if (baseToken === 'ALT' && quoteToken === 'WATT') {
      basePrice = 0.000173;
    } else if (baseToken === 'ALT' && quoteToken === 'USDT') {
      basePrice = 0.000173;
    } else if (baseToken === 'WATT' && quoteToken === 'USDT') {
      basePrice = 0.0002;
    } else if (baseToken === 'AltPEPE' && quoteToken === 'AltPEPI') {
      basePrice = 1.5;
    } else if (baseToken === 'AltPEPE' && quoteToken === 'wALT') {
      basePrice = 0.5;
    } else if (baseToken === 'SCAM' && quoteToken === 'wALT') {
      basePrice = 0.25;
    } else if (baseToken === 'SWAPD' && quoteToken === 'wALT') {
      basePrice = 0.75;
    } else if (baseToken === 'MALT' && quoteToken === 'wALT') {
      basePrice = 0.8;
    } else if (baseToken === 'AltPEPE' && quoteToken === 'WATT') {
      basePrice = 1.5;
    }
    
    // Generate candle data
    const candles: CandlestickData[] = [];
    const volumes: LineData[] = [];
    
    // Determine time interval based on timeframe
    let interval = 86400; // 1 day in seconds
    let count = 30;
    
    switch (timeframe) {
      case '15m':
        interval = 900; // 15 minutes
        count = 96; // 24 hours
        break;
      case '1H':
        interval = 3600; // 1 hour
        count = 48; // 2 days
        break;
      case '4H':
        interval = 14400; // 4 hours
        count = 42; // 7 days
        break;
      case '1D':
        interval = 86400; // 1 day
        count = 30; // 30 days
        break;
      case '1W':
        interval = 604800; // 1 week
        count = 26; // 6 months
        break;
    }
    
    // Generate data
    let time = Math.floor(Date.now() / 1000) - (interval * count);
    let price = basePrice;
    let trend = 0;
    let trendStrength = 0;
    
    for (let i = 0; i < count; i++) {
      // Change trend occasionally
      if (i % 10 === 0 || Math.random() < 0.1) {
        trend = Math.random() > 0.5 ? 1 : -1;
        trendStrength = Math.random() * 0.03; // 0-3% change per candle
      }
      
      // Calculate candle values
      const change = price * trendStrength * (Math.random() + 0.5) * trend;
      const open = price;
      const close = price + change;
      const high = Math.max(open, close) * (1 + Math.random() * 0.01);
      const low = Math.min(open, close) * (1 - Math.random() * 0.01);
      const volume = basePrice * 1000000 * (Math.random() + 0.5);
      
      // Add candle
      candles.push({
        time: time,
        open: open,
        high: high,
        low: low,
        close: close
      });
      
      // Add volume
      volumes.push({
        time: time,
        value: volume
      });
      
      // Update for next candle
      price = close;
      time += interval;
    }
    
    return { candles, volumes };
  };

  return (
    <div className="relative">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm z-10 rounded-lg">
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-slate-300">Loading chart data...</p>
          </div>
        </div>
      )}
      
      <div ref={chartContainerRef} className="w-full rounded-lg overflow-hidden" />
      
      {/* Price Stats */}
      {!isLoading && (
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-900/30 rounded-lg p-3">
            <p className="text-xs text-slate-400">Current Price</p>
            <p className="text-lg font-bold">${priceData.currentPrice.toFixed(6)}</p>
          </div>
          <div className="bg-slate-900/30 rounded-lg p-3">
            <p className="text-xs text-slate-400">24h Change</p>
            <div className="flex items-center space-x-1">
              {priceData.change24h >= 0 ? (
                <TrendingUp className="w-4 h-4 text-emerald-400" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-400" />
              )}
              <p className={`text-lg font-bold ${priceData.change24h >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {priceData.change24h >= 0 ? '+' : ''}{priceData.change24h.toFixed(2)}%
              </p>
            </div>
          </div>
          <div className="bg-slate-900/30 rounded-lg p-3">
            <p className="text-xs text-slate-400">24h High</p>
            <p className="text-lg font-bold">${priceData.high24h.toFixed(6)}</p>
          </div>
          <div className="bg-slate-900/30 rounded-lg p-3">
            <p className="text-xs text-slate-400">24h Low</p>
            <p className="text-lg font-bold">${priceData.low24h.toFixed(6)}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PriceChart;