import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface PerpTradingChartProps {
  symbol: string;
  interval?: string;
}

declare global {
  interface Window {
    TradingView: unknown;
  }
}

const PerpTradingChart: React.FC<PerpTradingChartProps> = ({ symbol, interval = '1D' }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<unknown>(null);

  useEffect(() => {
    // Load TradingView widget script
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/tv.js';
    script.async = true;
    script.onload = initializeChart;
    document.head.appendChild(script);

    return () => {
      if (chartRef.current) {
        try {
          chartRef.current.remove();
        } catch (error) {
          console.error('Error removing TradingView widget:', error);
        }
      }
    };
  }, []);

  useEffect(() => {
    if (window.TradingView && containerRef.current) {
      initializeChart();
    }
  }, [symbol, interval]);

  const initializeChart = () => {
    if (!window.TradingView || !containerRef.current) return;

    // Clear previous chart if exists
    if (chartRef.current) {
      try {
        chartRef.current.remove();
        containerRef.current.innerHTML = '';
      } catch (error) {
        console.error('Error removing previous chart:', error);
      }
    }

    // Map our internal symbol to TradingView symbol
    const symbolMap: Record<string, string> = {
      'BTC-USD': 'BITSTAMP:BTCUSD',
      'ETH-USD': 'BITSTAMP:ETHUSD',
      'ALT-USD': 'BINANCE:BTCUSDT', // Fallback since ALT isn't on TradingView
      'BTC-USDT': 'BINANCE:BTCUSDT',
      'ETH-USDT': 'BINANCE:ETHUSDT',
      'ALT-USDT': 'BINANCE:BTCUSDT', // Fallback
    };

    const tvSymbol = symbolMap[symbol] || 'BINANCE:BTCUSDT';

    // Create new chart
    chartRef.current = new window.TradingView.widget({
      container: containerRef.current,
      symbol: tvSymbol,
      interval: interval,
      timezone: 'Etc/UTC',
      theme: 'dark',
      style: '1',
      locale: 'en',
      toolbar_bg: '#1e293b',
      enable_publishing: false,
      hide_top_toolbar: false,
      hide_legend: false,
      save_image: false,
      height: 500,
      withdateranges: true,
      allow_symbol_change: false,
      studies: [
        'MASimple@tv-basicstudies',
        'RSI@tv-basicstudies',
        'Volume@tv-basicstudies'
      ],
      disabled_features: [
        'header_symbol_search',
        'header_compare',
      ],
      enabled_features: [
        'use_localstorage_for_settings',
        'side_toolbar_in_fullscreen_mode',
      ],
      overrides: {
        'mainSeriesProperties.candleStyle.upColor': '#10b981',
        'mainSeriesProperties.candleStyle.downColor': '#ef4444',
        'mainSeriesProperties.candleStyle.borderUpColor': '#10b981',
        'mainSeriesProperties.candleStyle.borderDownColor': '#ef4444',
        'mainSeriesProperties.candleStyle.wickUpColor': '#10b981',
        'mainSeriesProperties.candleStyle.wickDownColor': '#ef4444',
        'paneProperties.background': '#0f172a',
        'paneProperties.vertGridProperties.color': '#1e293b',
        'paneProperties.horzGridProperties.color': '#1e293b',
        'scalesProperties.textColor': '#94a3b8',
      }
    });
  };

  return (
    <motion.div
      className="bg-slate-800/30 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">
          {symbol.replace('-', '/')} Chart
        </h3>
        <div className="flex items-center space-x-2">
          <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded">
            TradingView
          </span>
        </div>
      </div>
      <div ref={containerRef} className="w-full h-[500px] rounded-lg overflow-hidden" />
    </motion.div>
  );
};

export default PerpTradingChart;