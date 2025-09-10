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
  const [rulerMode, setRulerMode] = useState(false);
  const [rulerPoints, setRulerPoints] = useState<{
    start?: { time: Time; price: number; x: number; y: number };
    end?: { time: Time; price: number; x: number; y: number };
  }>({});

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

    // Create ruler elements
    const rulerLine = document.createElement('div');
    rulerLine.style.position = 'absolute';
    rulerLine.style.display = 'none';
    rulerLine.style.background = isDarkMode ? '#3b82f6' : '#2563eb';
    rulerLine.style.height = '2px';
    rulerLine.style.pointerEvents = 'none';
    rulerLine.style.zIndex = '999';
    rulerLine.style.transformOrigin = 'left center';
    chartContainerRef.current.appendChild(rulerLine);

    const rulerInfo = document.createElement('div');
    rulerInfo.style.position = 'absolute';
    rulerInfo.style.display = 'none';
    rulerInfo.style.padding = '6px 8px';
    rulerInfo.style.background = isDarkMode ? '#1f2937' : '#f9fafb';
    rulerInfo.style.border = `1px solid ${isDarkMode ? '#374151' : '#d1d5db'}`;
    rulerInfo.style.borderRadius = '4px';
    rulerInfo.style.color = isDarkMode ? '#e5e7eb' : '#374151';
    rulerInfo.style.fontSize = '11px';
    rulerInfo.style.fontFamily = 'monospace';
    rulerInfo.style.pointerEvents = 'none';
    rulerInfo.style.zIndex = '1001';
    rulerInfo.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
    chartContainerRef.current.appendChild(rulerInfo);

    // Chart click subscription will be handled in a separate useEffect

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
      if (rulerLine && chartContainerRef.current) {
        chartContainerRef.current.removeChild(rulerLine);
      }
      if (rulerInfo && chartContainerRef.current) {
        chartContainerRef.current.removeChild(rulerInfo);
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

  // Handle ruler visualization
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const rulerLine = chartContainerRef.current.querySelector(
      'div[style*="transform-origin: left center"]'
    ) as HTMLElement;
    const rulerInfo = chartContainerRef.current.querySelector(
      'div[style*="z-index: 1001"]'
    ) as HTMLElement;

    if (!rulerLine || !rulerInfo) return;

    if (rulerPoints.start && rulerPoints.end) {
      // Calculate distance and angle
      const dx = rulerPoints.end.x - rulerPoints.start.x;
      const dy = rulerPoints.end.y - rulerPoints.start.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx) * (180 / Math.PI);

      // Position and style the line
      rulerLine.style.left = rulerPoints.start.x + 'px';
      rulerLine.style.top = rulerPoints.start.y + 'px';
      rulerLine.style.width = distance + 'px';
      rulerLine.style.transform = `rotate(${angle}deg)`;
      rulerLine.style.display = 'block';

      // Calculate price and time differences
      const priceDiff = rulerPoints.end.price - rulerPoints.start.price;
      const timeDiff =
        (rulerPoints.end.time as number) - (rulerPoints.start.time as number);
      const timeDiffHours = timeDiff / 3600;
      const priceDiffPercent = (priceDiff / rulerPoints.start.price) * 100;

      // Format time difference
      let timeText = '';
      if (timeDiffHours < 1) {
        timeText = `${Math.round(timeDiff / 60)}m`;
      } else if (timeDiffHours < 24) {
        timeText = `${Math.round(timeDiffHours * 10) / 10}h`;
      } else {
        timeText = `${Math.round((timeDiffHours / 24) * 10) / 10}d`;
      }

      // Update info display
      rulerInfo.innerHTML = `
         <div>ΔPrice: ${priceDiff >= 0 ? '+' : ''}${priceDiff.toFixed(
           4
         )} (${priceDiffPercent >= 0 ? '+' : ''}${priceDiffPercent.toFixed(
           2
         )}%)</div>
         <div>ΔTime: ${timeText}</div>
         <div>Distance: ${Math.round(distance)}px</div>
       `;

      // Position info box
      const midX = (rulerPoints.start.x + rulerPoints.end.x) / 2;
      const midY = (rulerPoints.start.y + rulerPoints.end.y) / 2;
      rulerInfo.style.left = midX + 'px';
      rulerInfo.style.top = midY - 40 + 'px';
      rulerInfo.style.display = 'block';
    } else if (rulerPoints.start) {
      // Show only start point
      rulerLine.style.display = 'none';
      rulerInfo.innerHTML = '<div>Click second point to measure</div>';
      rulerInfo.style.left = rulerPoints.start.x + 'px';
      rulerInfo.style.top = rulerPoints.start.y - 30 + 'px';
      rulerInfo.style.display = 'block';
    } else {
      // Hide all ruler elements
      rulerLine.style.display = 'none';
      rulerInfo.style.display = 'none';
    }
  }, [rulerPoints]);

  // Handle chart click subscription for ruler
  useEffect(() => {
    if (!chartRef.current || !candlestickSeriesRef.current) return;

    const chart = chartRef.current;
    const candlestickSeries = candlestickSeriesRef.current;

    const handleChartClick = (param: {
      point?: { x: number; y: number };
      time?: Time;
    }) => {
      console.log('Chart clicked:', { rulerMode, param });
      if (!param.point || !param.time) return;

      // Check if ruler mode is active
      if (!rulerMode) {
        console.log('Ruler mode is not active');
        return;
      }

      const price = candlestickSeries.coordinateToPrice(param.point.y);
      if (price === null) return;

      const point = {
        time: param.time,
        price: price,
        x: param.point.x,
        y: param.point.y,
      };

      console.log('Adding ruler point:', point);

      setRulerPoints(currentPoints => {
        if (!currentPoints.start) {
          console.log('Setting start point');
          return { start: point };
        } else if (!currentPoints.end) {
          console.log('Setting end point');
          return { ...currentPoints, end: point };
        } else {
          console.log('Resetting and setting new start point');
          return { start: point };
        }
      });
    };

    chart.subscribeClick(handleChartClick);

    return () => {
      chart.unsubscribeClick(handleChartClick);
    };
  }, [rulerMode]);

  return (
    <div className='relative'>
      {isLoading && (
        <div className='absolute inset-0 flex items-center justify-center bg-transparent z-10'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
        </div>
      )}
      <div className='absolute top-2 left-2 z-20 flex gap-2'>
        <button
          onClick={() => {
            console.log('Ruler button clicked, current rulerMode:', rulerMode);
            setRulerMode(!rulerMode);
            console.log('Setting rulerMode to:', !rulerMode);
            if (rulerMode) {
              setRulerPoints({});
              console.log('Cleared ruler points');
            }
          }}
          className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
            rulerMode
              ? 'bg-blue-600 text-white'
              : isDarkMode
                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          📏 Ruler
        </button>
        {rulerMode && rulerPoints.start && (
          <button
            onClick={() => setRulerPoints({})}
            className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
              isDarkMode
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-red-500 text-white hover:bg-red-600'
            }`}
          >
            Clear
          </button>
        )}
      </div>
      <div
        ref={chartContainerRef}
        className='w-full'
        style={{ height: `${height}px` }}
      />
    </div>
  );
};

export default TradingViewChart;
