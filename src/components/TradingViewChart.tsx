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
          color: isDarkMode ? '#222831' : '#ffffff',
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
      localization: {
        timeFormatter: (time: number) => {
          const date = new Date(time * 1000);
          return date.toLocaleString([], {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          });
        },
        dateFormat: 'dd MMM yyyy',
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

    // Create tooltip element
    const tooltip = document.createElement('div');
    tooltip.style.position = 'absolute';
    tooltip.style.display = 'none';
    tooltip.style.padding = '8px';
    tooltip.style.background = isDarkMode ? '#222831' : '#ffffff';
    tooltip.style.border = `1px solid ${isDarkMode ? '#485c7b' : '#cccccc'}`;
    tooltip.style.borderRadius = '4px';
    tooltip.style.color = isDarkMode ? '#ffffff' : '#191919';
    tooltip.style.fontSize = '12px';
    tooltip.style.fontFamily = 'monospace';
    tooltip.style.pointerEvents = 'none';
    tooltip.style.zIndex = '1000';
    tooltip.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
    chartContainerRef.current.appendChild(tooltip);

    // Add crosshair move handler for tooltip
    chart.subscribeCrosshairMove(param => {
      if (!param.point || !param.time || !candlestickSeries) {
        tooltip.style.display = 'none';
        return;
      }

      const data = param.seriesData.get(candlestickSeries) as CandlestickData;
      if (!data) {
        tooltip.style.display = 'none';
        return;
      }

      const open = data.open;
      const high = data.high;
      const low = data.low;
      const close = data.close;
      const change = close - open;
      const changePercent = (change / open) * 100;
      const changeColor = change >= 0 ? '#10b981' : '#ef4444';
      const changeSign = change >= 0 ? '+' : '';

      const valueColor = isDarkMode ? '#ffffff' : '#6b7280';
      tooltip.innerHTML = `
          <div>Open: <span style="color: ${valueColor};">${open.toFixed(4)}</span></div>
          <div>High: <span style="color: ${valueColor};">${high.toFixed(4)}</span></div>
          <div>Low: <span style="color: ${valueColor};">${low.toFixed(4)}</span></div>
          <div>Close: <span style="color: ${valueColor};">${close.toFixed(4)}</span></div>
          <div>Change: <span style="color: ${changeColor};">${changeSign}${change.toFixed(4)} (${changeSign}${changePercent.toFixed(2)}%)</span></div>
        `;

      const container = chartContainerRef.current;
      if (!container) return;

      const tooltipWidth = 200;
      const tooltipHeight = 120;

      let left = param.point.x + 10;
      let top = param.point.y - 10;

      // Adjust position if tooltip would go outside container
      if (left + tooltipWidth > container.clientWidth) {
        left = param.point.x - tooltipWidth - 10;
      }
      if (top < 0) {
        top = param.point.y + 10;
      }
      if (top + tooltipHeight > container.clientHeight) {
        top = container.clientHeight - tooltipHeight - 10;
      }

      tooltip.style.left = left + 'px';
      tooltip.style.top = top + 'px';
      tooltip.style.display = 'block';
    });

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
      if (tooltip && chartContainerRef.current) {
        chartContainerRef.current.removeChild(tooltip);
      }
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
            color: isDarkMode ? '#222831' : '#ffffff',
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
        <div className='absolute inset-0 flex items-center justify-center bg-transparent z-10'>
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
