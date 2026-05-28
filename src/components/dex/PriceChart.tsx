import { useEffect, useRef, useState } from 'react';
import { createChart, ColorType } from 'lightweight-charts';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { usePrices } from '../../hooks/usePrices';

interface PriceChartProps {
  symbol?: string;
  interval?: string;
}

const PriceChart: React.FC<PriceChartProps> = ({ 
  symbol = 'ALT/USDT', 
  interval = '1D' 
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { getPrice, formatChange } = usePrices(['ALT', 'BTC', 'ETH', 'WATT', 'PEPE', 'PEPI', 'MALT', 'SWAPD', 'SCAM']);
  
  const baseSymbol = symbol.split('/')[0];
  const priceData = getPrice(baseSymbol);
  const change = formatChange(baseSymbol);

  useEffect(() => {
    if (!chartContainerRef.current) return;
    
    setIsLoading(true);
    
    const handleResize = () => {
      chart.applyOptions({ width: chartContainerRef.current?.clientWidth });
    };

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#0f172a' },
        textColor: '#94a3b8',
      },
      width: chartContainerRef.current.clientWidth,
      height: 400,
      grid: {
        vertLines: { color: '#1e293b' },
        horzLines: { color: '#1e293b' },
      },
      timeScale: {
        borderColor: '#1e293b',
      },
      rightPriceScale: {
        borderColor: '#1e293b',
      },
      crosshair: {
        mode: 0,
      },
    });

    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#10b981',
      downColor: '#ef4444',
      borderUpColor: '#10b981',
      borderDownColor: '#ef4444',
      wickUpColor: '#10b981',
      wickDownColor: '#ef4444',
    });

    // Generate mock data
    const currentDate = new Date();
    const mockData = [];
    
    // Get base price from the price service
    const basePrice = priceData?.price || 
                     (baseSymbol === 'ALT' ? 0.000173 : 
                      baseSymbol === 'WATT' ? 2.0 : 
                      baseSymbol === 'PEPE' ? 0.0000012 : 
                      baseSymbol === 'PEPI' ? 0.0000008 : 
                      baseSymbol === 'MALT' ? 0.05 : 
                      baseSymbol === 'SWAPD' ? 0.1 : 
                      baseSymbol === 'SCAM' ? 0.00001 : 1.0);
    
    // Generate 100 days of data
    for (let i = 100; i >= 0; i--) {
      const date = new Date();
      date.setDate(currentDate.getDate() - i);
      
      // Add some randomness to the price
      const volatility = 0.03; // 3% daily volatility
      const changePercent = (Math.random() - 0.5) * volatility;
      const dayFactor = 1 + changePercent;
      
      // Calculate price with some trend
      let price = basePrice;
      if (i < 100) {
        // Apply some trend - upward for most tokens
        const trendFactor = baseSymbol === 'SCAM' ? 0.99 : 1.01; // SCAM token trends down
        price = mockData[mockData.length - 1].close * dayFactor * (Math.random() > 0.4 ? trendFactor : 1/trendFactor);
      }
      
      // Daily range
      const high = price * (1 + Math.random() * 0.02);
      const low = price * (1 - Math.random() * 0.02);
      const open = low + Math.random() * (high - low);
      const close = low + Math.random() * (high - low);
      
      mockData.push({
        time: Math.floor(date.getTime() / 1000),
        open,
        high,
        low,
        close
      });
    }

    candlestickSeries.setData(mockData);
    
    // Add volume series
    const volumeSeries = chart.addHistogramSeries({
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
    
    // Generate volume data
    const volumeData = mockData.map(item => ({
      time: item.time,
      value: Math.random() * 100000 * basePrice,
      color: item.open <= item.close ? '#10b981' : '#ef4444'
    }));
    
    volumeSeries.setData(volumeData);
    
    // Fit content
    chart.timeScale().fitContent();
    
    window.addEventListener('resize', handleResize);
    
    setIsLoading(false);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [symbol, interval, baseSymbol, priceData]);

  return (
    <div className="bg-slate-800/30 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4">
          <h3 className="text-lg font-semibold">{symbol} Chart</h3>
          <div className={`flex items-center space-x-1 ${
            change.isPositive ? 'text-emerald-400' : 'text-red-400'
          }`}>
            {change.isPositive ? (
              <TrendingUp className="w-4 h-4" />
            ) : (
              <TrendingDown className="w-4 h-4" />
            )}
            <span className="text-sm font-medium">{change.value}</span>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {['15m', '1h', '4h', '1d', '1w'].map((timeframe) => (
            <button
              key={timeframe}
              className={`px-3 py-1 text-sm rounded transition-colors ${
                interval === timeframe
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700/50 hover:bg-slate-600/50'
              }`}
            >
              {timeframe}
            </button>
          ))}
        </div>
      </div>
      
      {isLoading ? (
        <div className="h-[400px] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div ref={chartContainerRef} className="h-[400px]" />
      )}
    </div>
  );
};

export default PriceChart;