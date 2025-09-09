'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  createChart,
  IChartApi,
  ISeriesApi,
  CandlestickData,
  HistogramData,
  ColorType,
  Time,
  CandlestickSeries,
  HistogramSeries,
} from 'lightweight-charts';

interface CandleData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  quoteVolume: number;
}

interface TradingViewChartProps {
  data: CandleData[];
  symbol?: string;
  isDarkMode?: boolean;
  height?: number;
}

const TradingViewChart: React.FC<TradingViewChartProps> = ({
  data,
  symbol,
  isDarkMode = true,
  height = 400,
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Transform data for TradingView format
  const transformData = (chartData: CandleData[]) => {
    const candlestickData: CandlestickData[] = [];
    const volumeData: HistogramData[] = [];

    chartData.forEach(item => {
      const timestamp = (item.timestamp / 1000) as Time; // Convert to Unix timestamp in seconds

      candlestickData.push({
        time: timestamp,
        open: item.open,
        high: item.high,
        low: item.low,
        close: item.close,
      });

      volumeData.push({
        time: timestamp,
        value: item.volume,
        color: item.close >= item.open ? '#26a69a' : '#ef5350',
      });
    });

    return { candlestickData, volumeData };
  };

  useEffect(() => {
    if (!chartContainerRef.current || data.length === 0) return;

    // Create chart
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: {
          type: ColorType.Solid,
          color: isDarkMode ? '#1f2937' : '#ffffff',
        },
        textColor: isDarkMode ? '#e5e7eb' : '#374151',
        fontSize: 12,
        fontFamily:
          'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      },
      grid: {
        vertLines: {
          color: isDarkMode ? '#374151' : '#e5e7eb',
          style: 1,
        },
        horzLines: {
          color: isDarkMode ? '#374151' : '#e5e7eb',
          style: 1,
        },
      },
      crosshair: {
        mode: 1,
        vertLine: {
          color: isDarkMode ? '#6b7280' : '#9ca3af',
          width: 1,
          style: 3,
        },
        horzLine: {
          color: isDarkMode ? '#6b7280' : '#9ca3af',
          width: 1,
          style: 3,
        },
      },
      rightPriceScale: {
        borderColor: isDarkMode ? '#4b5563' : '#d1d5db',
        textColor: isDarkMode ? '#e5e7eb' : '#374151',
        scaleMargins: {
          top: 0.1,
          bottom: 0.2,
        },
      },
      timeScale: {
        borderColor: isDarkMode ? '#4b5563' : '#d1d5db',
        timeVisible: true,
        secondsVisible: false,
      },
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
        horzTouchDrag: true,
        vertTouchDrag: true,
      },
      handleScale: {
        axisPressedMouseMove: true,
        mouseWheel: true,
        pinch: true,
      },
      width: chartContainerRef.current.clientWidth,
      height: height,
    });

    // Add candlestick series
    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#10b981', // Green for up candles
      downColor: '#ef4444', // Red for down candles
      borderVisible: false,
      wickUpColor: '#10b981',
      wickDownColor: '#ef4444',
      borderUpColor: '#10b981',
      borderDownColor: '#ef4444',
      wickVisible: true,
      priceFormat: {
        type: 'price',
        precision: 4,
        minMove: 0.0001,
      },
    });

    // Add volume series
    const volumeSeries = chart.addSeries(HistogramSeries, {
      color: isDarkMode ? '#6b7280' : '#9ca3af',
      priceFormat: {
        type: 'volume',
      },
      priceScaleId: 'volume',
    });

    // Configure volume scale
    chart.priceScale('volume').applyOptions({
      scaleMargins: {
        top: 0.7,
        bottom: 0,
      },
    });

    // Configure volume price scale
    chart.priceScale('volume').applyOptions({
      scaleMargins: {
        top: 0.8,
        bottom: 0,
      },
    });

    // Transform and set data
    const { candlestickData, volumeData } = transformData(data);
    candlestickSeries.setData(candlestickData);
    volumeSeries.setData(volumeData);

    // Fit content
    chart.timeScale().fitContent();

    // Store references
    chartRef.current = chart;
    candlestickSeriesRef.current = candlestickSeries;
    volumeSeriesRef.current = volumeSeries;

    setIsLoading(false);

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current && chart) {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (chart) {
        chart.remove();
      }
    };
  }, [data, isDarkMode, height]);

  // Update theme when dark mode changes
  useEffect(() => {
    if (chartRef.current) {
      chartRef.current.applyOptions({
        layout: {
          background: {
            type: ColorType.Solid,
            color: isDarkMode ? '#1a1a1a' : '#ffffff',
          },
          textColor: isDarkMode ? '#d1d4dc' : '#191919',
        },
        grid: {
          vertLines: {
            color: isDarkMode ? '#2a2a2a' : '#e1e1e1',
          },
          horzLines: {
            color: isDarkMode ? '#2a2a2a' : '#e1e1e1',
          },
        },
        rightPriceScale: {
          borderColor: isDarkMode ? '#485c7b' : '#cccccc',
        },
        timeScale: {
          borderColor: isDarkMode ? '#485c7b' : '#cccccc',
        },
      });
    }
  }, [isDarkMode]);

  return (
    <div className='relative'>
      {isLoading && (
        <div className='absolute inset-0 flex items-center justify-center bg-opacity-50 z-10'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
        </div>
      )}
      <div
        ref={chartContainerRef}
        className='w-full'
        style={{ height: `${height}px` }}
      />
    </div>
  );
};

export default TradingViewChart;
