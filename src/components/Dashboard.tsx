'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import TradingViewChart from './TradingViewChart';
import { Download, RefreshCw, Moon, Sun, Pause, Play } from 'lucide-react';
import {
  bitgetApi,
  CandleData,
  SymbolInfo,
  OrderbookData,
  MarketType,
} from '@/services/bitgetApi';
import { cn, formatCurrency, formatPercentage } from '@/lib/utils';

interface DashboardProps {
  className?: string;
}

interface ChartData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

const granularityOptions = [
  { value: '1min', label: '1 Minute' },
  { value: '5min', label: '5 Minutes' },
  { value: '15min', label: '15 Minutes' },
  { value: '1h', label: '1 Hour' },
  { value: '4h', label: '4 Hours' },
  { value: '1day', label: '1 Day' },
  { value: '1week', label: '1 Week' },
  { value: '1month', label: '1 Month' },
];

const timeRangeOptions = [
  { value: 1, label: '1 Day' },
  { value: 3, label: '3 Days' },
  { value: 7, label: '7 Days' },
  { value: 14, label: '2 Weeks' },
  { value: 30, label: '30 Days' },
  { value: 60, label: '2 Months' },
  { value: 90, label: '3 Months' },
  { value: 180, label: '6 Months' },
  { value: 365, label: '1 Year' },
  { value: 730, label: '2 Years' },
];

const marketTypeOptions = [
  { value: 'spot' as MarketType, label: 'Spot' },
  { value: 'futures' as MarketType, label: 'Futures' },
];

const Dashboard: React.FC<DashboardProps> = ({ className }) => {
  const [symbols, setSymbols] = useState<SymbolInfo[]>([]);
  const [selectedSymbol, setSelectedSymbol] = useState<string>('BTCUSDT');
  const [marketType, setMarketType] = useState<MarketType>('spot');
  const [symbolSearch, setSymbolSearch] = useState<string>('');
  const [isSymbolDropdownOpen, setIsSymbolDropdownOpen] =
    useState<boolean>(false);
  const [isTimeRangeDropdownOpen, setIsTimeRangeDropdownOpen] =
    useState<boolean>(false);
  const [isGranularityDropdownOpen, setIsGranularityDropdownOpen] =
    useState<boolean>(false);
  const [isMarketTypeDropdownOpen, setIsMarketTypeDropdownOpen] =
    useState<boolean>(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const timeRangeDropdownRef = useRef<HTMLDivElement>(null);
  const granularityDropdownRef = useRef<HTMLDivElement>(null);
  const marketTypeDropdownRef = useRef<HTMLDivElement>(null);
  const [historicalData, setHistoricalData] = useState<CandleData[]>([]);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [timeRange, setTimeRange] = useState<number>(30);
  const [granularity, setGranularity] = useState<string>('1day');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  const [summary, setSummary] = useState<{
    totalDays: number;
    startDate: string;
    endDate: string;
    startPrice: number;
    endPrice: number;
    highestPrice: number;
    lowestPrice: number;
    totalVolume: number;
    priceChange: number;
    priceChangePercent: number;
  } | null>(null);
  const [orderbook, setOrderbook] = useState<OrderbookData | null>(null);
  const [orderbookLoading, setOrderbookLoading] = useState<boolean>(false);
  const [orderbookError, setOrderbookError] = useState<string>('');
  const [autoRefreshOrderbook, setAutoRefreshOrderbook] =
    useState<boolean>(true);

  // Pagination state for symbol dropdown
  const [symbolPage, setSymbolPage] = useState<number>(0);
  const [symbolsPerPage] = useState<number>(50);
  const [showAllSymbols, setShowAllSymbols] = useState<boolean>(false);
  const [quoteCurrencyFilter, setQuoteCurrencyFilter] =
    useState<string>('USDT');
  const [showPopularOnly, setShowPopularOnly] = useState<boolean>(false);

  const loadOrderbook = useCallback(async () => {
    setOrderbookLoading(true);
    setOrderbookError('');
    try {
      const orderbookData = await bitgetApi.getOrderbookByMarket(
        marketType as MarketType,
        selectedSymbol,
        20
      );
      setOrderbook(orderbookData);
    } catch (err) {
      console.error('Failed to load orderbook:', err);
      setOrderbookError(`Failed to load orderbook for ${selectedSymbol}`);
    } finally {
      setOrderbookLoading(false);
    }
  }, [selectedSymbol, marketType]);

  const loadHistoricalData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await bitgetApi.getDataForAIByMarket(
        marketType as MarketType,
        selectedSymbol,
        timeRange,
        granularity
      );
      setHistoricalData(result.data);
      setSummary(result.summary);

      // Transform data for chart (keep original for TradingView)
      const transformed = result.data.map(item => ({
        date: new Date(item.timestamp).toLocaleDateString(),
        open: item.open,
        high: item.high,
        low: item.low,
        close: item.close,
        volume: item.volume,
      }));
      setChartData(transformed);
    } catch (err) {
      console.error('Failed to load historical data:', err);
      setError(`Failed to load data for ${selectedSymbol}`);
    } finally {
      setLoading(false);
    }
  }, [selectedSymbol, marketType, timeRange, granularity]);

  // Apply dark mode to document
  useEffect(() => {
    console.log('Dark mode useEffect triggered, isDarkMode:', isDarkMode);
    if (isDarkMode) {
      document.documentElement.setAttribute('data-theme', 'dark');
      document.documentElement.classList.add('dark');
      console.log('Applied dark mode');
    } else {
      document.documentElement.removeAttribute('data-theme');
      document.documentElement.classList.remove('dark');
      console.log('Applied light mode');
    }
    // Note: localStorage is not supported in Claude.ai artifacts
    // If you're using this in your own environment, you can uncomment the line below:
    // localStorage.setItem('darkMode', isDarkMode.toString());
  }, [isDarkMode]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsSymbolDropdownOpen(false);
      }
      if (
        timeRangeDropdownRef.current &&
        !timeRangeDropdownRef.current.contains(event.target as Node)
      ) {
        setIsTimeRangeDropdownOpen(false);
      }
      if (
        granularityDropdownRef.current &&
        !granularityDropdownRef.current.contains(event.target as Node)
      ) {
        setIsGranularityDropdownOpen(false);
      }
      if (
        marketTypeDropdownRef.current &&
        !marketTypeDropdownRef.current.contains(event.target as Node)
      ) {
        setIsMarketTypeDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Popular symbols list for filtering
  const popularSymbols = [
    'BTC',
    'ETH',
    'BNB',
    'ADA',
    'SOL',
    'XRP',
    'DOT',
    'DOGE',
    'AVAX',
    'MATIC',
    'LINK',
    'UNI',
    'LTC',
    'BCH',
    'ATOM',
    'FIL',
    'TRX',
    'ETC',
    'XLM',
    'SUI',
  ];

  // Load available symbols on component mount
  useEffect(() => {
    const loadSymbols = async () => {
      try {
        const symbolsData = await bitgetApi.getSymbolsByMarket(
          marketType as MarketType
        );
        // Filter based on quote currency and status
        // Note: spot symbols use 'online', futures symbols use 'normal'
        const validStatus = marketType === 'futures' ? 'normal' : 'online';
        let filteredData = symbolsData.filter(
          s => s.quoteCoin === quoteCurrencyFilter && s.status === validStatus
        );

        // Apply popular filter if enabled
        if (showPopularOnly) {
          filteredData = filteredData.filter(s =>
            popularSymbols.includes(s.baseCoin)
          );
        }

        // Sort alphabetically
        filteredData.sort((a, b) => a.symbol.localeCompare(b.symbol));
        setSymbols(filteredData as SymbolInfo[]);
      } catch (err) {
        console.error('Failed to load symbols:', err);
        setError('Failed to load available symbols');
      }
    };
    loadSymbols();
  }, [quoteCurrencyFilter, showPopularOnly, marketType]);

  // Load historical data when symbol or time range changes
  useEffect(() => {
    if (selectedSymbol) {
      loadHistoricalData();
    }
  }, [selectedSymbol, timeRange, granularity, loadHistoricalData]);

  // Load orderbook data when symbol changes
  useEffect(() => {
    if (selectedSymbol) {
      loadOrderbook();
    }
  }, [selectedSymbol, loadOrderbook]);

  // Auto-refresh orderbook every 30 seconds (less distracting)
  useEffect(() => {
    if (!selectedSymbol || !autoRefreshOrderbook) return;

    const interval = setInterval(() => {
      loadOrderbook();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [selectedSymbol, autoRefreshOrderbook, loadOrderbook]);

  // Reset pagination when search changes
  useEffect(() => {
    setSymbolPage(0);
  }, [symbolSearch]);

  const handleExportCSV = () => {
    if (historicalData.length === 0) return;

    const csv = bitgetApi.exportToCSV(historicalData, selectedSymbol);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedSymbol}_${timeRange}days_${granularity}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportJSON = () => {
    if (historicalData.length === 0) return;

    const json = bitgetApi.exportToJSON(
      historicalData,
      selectedSymbol,
      summary || undefined
    );
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedSymbol}_${timeRange}days_${granularity}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const generateAIPrompt = () => {
    if (!summary || historicalData.length === 0) return '';

    const granularityLabel =
      granularityOptions.find(option => option.value === granularity)?.label ||
      granularity;

    return `Analyze this cryptocurrency data for ${selectedSymbol}:

Summary:
- Period: ${summary.startDate} to ${summary.endDate} (${summary.totalDays} days)
- Data Granularity: ${granularityLabel}
- Price Range: ${formatCurrency(summary.lowestPrice)} - ${formatCurrency(summary.highestPrice)}
- Start Price: ${formatCurrency(summary.startPrice)}
- End Price: ${formatCurrency(summary.endPrice)}
- Price Change: ${formatCurrency(summary.priceChange)} (${formatPercentage(summary.priceChangePercent / 100)})
- Total Volume: ${summary.totalVolume.toLocaleString()}

Please provide:
1. Technical analysis of the price movement
2. Key support and resistance levels
3. Trading recommendations
4. Risk assessment
5. Potential future price targets

Historical data is available in the exported CSV/JSON files.`;
  };

  const copyAIPrompt = () => {
    const prompt = generateAIPrompt();
    navigator.clipboard.writeText(prompt);
    alert('AI analysis prompt copied to clipboard!');
  };

  const toggleDarkMode = () => {
    console.log('Toggle dark mode clicked, current state:', isDarkMode);
    setIsDarkMode(!isDarkMode);
  };

  // Filter symbols based on search
  const filteredSymbols = symbols.filter(
    symbol =>
      symbol.symbol.toLowerCase().includes(symbolSearch.toLowerCase()) ||
      symbol.baseCoin.toLowerCase().includes(symbolSearch.toLowerCase())
  );

  // Pagination logic for symbols
  const totalPages = Math.ceil(filteredSymbols.length / symbolsPerPage);
  const paginatedSymbols = showAllSymbols
    ? filteredSymbols
    : filteredSymbols.slice(
        symbolPage * symbolsPerPage,
        (symbolPage + 1) * symbolsPerPage
      );

  const handleNextPage = () => {
    if (symbolPage < totalPages - 1) {
      setSymbolPage(symbolPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (symbolPage > 0) {
      setSymbolPage(symbolPage - 1);
    }
  };

  const toggleShowAllSymbols = () => {
    setShowAllSymbols(!showAllSymbols);
    setSymbolPage(0); // Reset to first page when toggling
  };

  const handleSymbolSelect = (symbol: string) => {
    setSelectedSymbol(symbol);
    setSymbolSearch('');
    setIsSymbolDropdownOpen(false);
  };

  return (
    <div className={cn('p-6 max-w-7xl mx-auto space-y-6', className)}>
      {/* Dark Mode Toggle */}
      <button
        onClick={toggleDarkMode}
        className='dark-mode-toggle'
        title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {isDarkMode ? (
          <Sun className='w-4 h-4' />
        ) : (
          <Moon className='w-4 h-4' />
        )}
        {isDarkMode ? 'Light' : 'Dark'}
      </button>

      {/* Header */}
      <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4'>
        <div>
          <h1 className='text-3xl font-bold'>CoinAI Analytics</h1>
          <p className='text-muted mt-1'>
            Historical data analysis for AI-powered trading insights
          </p>
        </div>
        <button
          onClick={loadHistoricalData}
          disabled={loading}
          className='dashboard-button flex items-center gap-2 px-4 py-2 rounded-lg disabled:opacity-50'
        >
          <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
          Refresh Data
        </button>
      </div>

      {/* Controls */}
      <div className='dashboard-card grid grid-cols-1 md:grid-cols-5 gap-4 p-4 rounded-lg'>
        <div className='relative' ref={dropdownRef}>
          <label className='block text-sm font-medium mb-2'>Symbol</label>
          <div className='relative'>
            <input
              type='text'
              value={isSymbolDropdownOpen ? symbolSearch : selectedSymbol}
              onChange={e => {
                setSymbolSearch(e.target.value);
                setIsSymbolDropdownOpen(true);
              }}
              onFocus={() => setIsSymbolDropdownOpen(true)}
              placeholder='Search symbols...'
              className='dashboard-input w-full p-2 rounded-md pr-8'
            />
            <button
              onClick={() => setIsSymbolDropdownOpen(!isSymbolDropdownOpen)}
              className='absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600'
            >
              <svg
                className={`w-4 h-4 transition-transform ${
                  isSymbolDropdownOpen ? 'rotate-180' : ''
                }`}
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M19 9l-7 7-7-7'
                />
              </svg>
            </button>
            {isSymbolDropdownOpen && (
              <div className='absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md max-h-80 overflow-hidden shadow-lg'>
                {/* Header with controls */}
                <div className='px-3 py-2 border-b border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700'>
                  <div className='flex justify-between items-center text-xs'>
                    <span className='text-gray-600 dark:text-gray-400'>
                      {filteredSymbols.length} symbols found
                    </span>
                    <button
                      onClick={toggleShowAllSymbols}
                      className='text-blue-600 dark:text-blue-400 hover:underline'
                    >
                      {showAllSymbols ? 'Show paginated' : 'Show all'}
                    </button>
                  </div>
                </div>

                {/* Symbol list */}
                <div className='max-h-48 overflow-y-auto'>
                  {paginatedSymbols.length > 0 ? (
                    paginatedSymbols.map(symbol => (
                      <button
                        key={symbol.symbol}
                        onClick={() => handleSymbolSelect(symbol.symbol)}
                        className='w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex justify-between items-center transition-colors'
                      >
                        <span className='font-medium'>{symbol.symbol}</span>
                        <span className='text-sm text-gray-500'>
                          {symbol.baseCoin}
                        </span>
                      </button>
                    ))
                  ) : (
                    <div className='px-3 py-2 text-gray-500 text-sm'>
                      No symbols found
                    </div>
                  )}
                </div>

                {/* Pagination controls */}
                {!showAllSymbols && totalPages > 1 && (
                  <div className='px-3 py-2 border-t border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700'>
                    <div className='flex justify-between items-center text-xs'>
                      <button
                        onClick={handlePrevPage}
                        disabled={symbolPage === 0}
                        className='text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-50 disabled:cursor-not-allowed'
                      >
                        Previous
                      </button>
                      <span className='text-gray-600 dark:text-gray-400'>
                        Page {symbolPage + 1} of {totalPages}
                      </span>
                      <button
                        onClick={handleNextPage}
                        disabled={symbolPage >= totalPages - 1}
                        className='text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-50 disabled:cursor-not-allowed'
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className='relative' ref={marketTypeDropdownRef}>
          <label className='block text-sm font-medium mb-2'>Market Type</label>
          <div className='relative'>
            <button
              onClick={() =>
                setIsMarketTypeDropdownOpen(!isMarketTypeDropdownOpen)
              }
              className='dashboard-input w-full p-2 rounded-md pr-8 text-left bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors'
            >
              {marketTypeOptions.find(option => option.value === marketType)
                ?.label || 'Select Market Type'}
              <svg
                className={`absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 transition-transform ${
                  isMarketTypeDropdownOpen ? 'rotate-180' : ''
                }`}
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M19 9l-7 7-7-7'
                />
              </svg>
            </button>
            {isMarketTypeDropdownOpen && (
              <div className='absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md shadow-lg'>
                {marketTypeOptions.map(option => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setMarketType(option.value);
                      setIsMarketTypeDropdownOpen(false);
                    }}
                    className={cn(
                      'w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors',
                      marketType === option.value &&
                        'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className='relative' ref={timeRangeDropdownRef}>
          <label className='block text-sm font-medium mb-2'>Time Range</label>
          <div className='relative'>
            <button
              onClick={() =>
                setIsTimeRangeDropdownOpen(!isTimeRangeDropdownOpen)
              }
              className='dashboard-input w-full p-2 rounded-md pr-8 text-left bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors'
            >
              {timeRangeOptions.find(option => option.value === timeRange)
                ?.label || '30 Days'}
            </button>
            <button
              onClick={() =>
                setIsTimeRangeDropdownOpen(!isTimeRangeDropdownOpen)
              }
              className='absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600'
            >
              <svg
                className={`w-4 h-4 transition-transform ${
                  isTimeRangeDropdownOpen ? 'rotate-180' : ''
                }`}
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M19 9l-7 7-7-7'
                />
              </svg>
            </button>
            {isTimeRangeDropdownOpen && (
              <div className='absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md max-h-60 overflow-y-auto shadow-lg'>
                {timeRangeOptions.map(option => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setTimeRange(option.value);
                      setIsTimeRangeDropdownOpen(false);
                    }}
                    className='w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex justify-between items-center transition-colors'
                  >
                    <span className='font-medium'>{option.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className='relative' ref={granularityDropdownRef}>
          <label className='block text-sm font-medium mb-2'>Granularity</label>
          <div className='relative'>
            <button
              onClick={() =>
                setIsGranularityDropdownOpen(!isGranularityDropdownOpen)
              }
              className='dashboard-input w-full p-2 rounded-md pr-8 text-left bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors'
            >
              {granularityOptions.find(option => option.value === granularity)
                ?.label || '1 Day'}
            </button>
            <button
              onClick={() =>
                setIsGranularityDropdownOpen(!isGranularityDropdownOpen)
              }
              className='absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600'
            >
              <svg
                className={`w-4 h-4 transition-transform ${
                  isGranularityDropdownOpen ? 'rotate-180' : ''
                }`}
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M19 9l-7 7-7-7'
                />
              </svg>
            </button>
            {isGranularityDropdownOpen && (
              <div className='absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md max-h-60 overflow-y-auto shadow-lg'>
                {granularityOptions.map(option => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setGranularity(option.value);
                      setIsGranularityDropdownOpen(false);
                    }}
                    className='w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex justify-between items-center transition-colors'
                  >
                    <span className='font-medium'>{option.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className='flex flex-col gap-2'>
          <label className='block text-sm font-medium'>Export Data</label>
          <div className='flex gap-2'>
            <button
              onClick={handleExportCSV}
              disabled={historicalData.length === 0}
              className='dashboard-button-secondary flex items-center justify-center gap-1 px-2 py-3 rounded-md disabled:opacity-50 text-sm'
            >
              <Download className='w-4 h-4' />
              CSV
            </button>
            <button
              onClick={handleExportJSON}
              disabled={historicalData.length === 0}
              className='dashboard-button-secondary flex items-center justify-center gap-1 px-2 py-3 rounded-md disabled:opacity-50 text-sm'
            >
              <Download className='w-4 h-4' />
              JSON
            </button>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className='dashboard-card p-4 rounded-lg'>
          <p className='text-red-600'>{error}</p>
        </div>
      )}

      {/* Summary Cards */}
      {summary && (
        <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
          <div className='dashboard-card p-4 rounded-lg'>
            <div>
              <p className='text-sm text-muted'>Current Price</p>
              <p className='text-2xl font-bold'>
                {formatCurrency(summary.endPrice)}
              </p>
            </div>
          </div>

          <div className='dashboard-card p-4 rounded-lg'>
            <div>
              <p className='text-sm text-muted'>Price Change</p>
              <p
                className={cn(
                  'text-2xl font-bold',
                  summary.priceChange >= 0 ? 'text-green-600' : 'text-red-600'
                )}
              >
                {formatPercentage(summary.priceChangePercent / 100)}
              </p>
            </div>
          </div>

          <div className='dashboard-card p-4 rounded-lg'>
            <div>
              <p className='text-sm text-muted'>High / Low</p>
              <p className='text-2xl font-bold'>
                {formatCurrency(summary.highestPrice)} /{' '}
                {formatCurrency(summary.lowestPrice)}
              </p>
            </div>
          </div>

          <div className='dashboard-card p-4 rounded-lg'>
            <div>
              <p className='text-sm text-muted'>Total Volume</p>
              <p className='text-2xl font-bold'>
                {summary.totalVolume.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Chart */}
      <div className='dashboard-card p-6 rounded-lg'>
        <h2 className='text-xl font-semibold mb-4'>
          Price Chart - {selectedSymbol}
        </h2>
        {loading ? (
          <div className='flex items-center justify-center h-96'>
            <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600'></div>
          </div>
        ) : historicalData.length > 0 ? (
          <TradingViewChart
            data={historicalData}
            isDarkMode={isDarkMode}
            height={400}
          />
        ) : (
          <div className='flex items-center justify-center h-96 text-muted'>
            No data available
          </div>
        )}
      </div>

      {/* Orderbook Section */}
      <div className='dashboard-card p-6 rounded-lg'>
        <div className='flex items-center justify-between mb-4'>
          <h2 className='text-xl font-semibold'>
            Order Book - {selectedSymbol}
          </h2>
          <div className='flex items-center gap-2'>
            <button
              onClick={() => setAutoRefreshOrderbook(!autoRefreshOrderbook)}
              className={cn(
                'flex items-center gap-2 px-3 py-1 rounded-md text-sm',
                autoRefreshOrderbook
                  ? 'bg-transparent text-green-700 hover:bg-transparent dark:text-green-400 dark:hover:bg-transparent'
                  : 'bg-transparent text-gray-700 hover:bg-transparent dark:text-gray-400 dark:hover:bg-transparent'
              )}
              title={
                autoRefreshOrderbook
                  ? 'Disable auto-refresh (30s)'
                  : 'Enable auto-refresh (30s)'
              }
            >
              {autoRefreshOrderbook ? (
                <Pause className='w-3 h-3' />
              ) : (
                <Play className='w-3 h-3' />
              )}
              {autoRefreshOrderbook ? 'Auto' : 'Manual'}
            </button>
            <button
              onClick={loadOrderbook}
              disabled={orderbookLoading}
              className='dashboard-button-secondary flex items-center gap-2 px-3 py-1 rounded-md disabled:opacity-50 text-sm'
            >
              <RefreshCw
                className={cn('w-3 h-3', orderbookLoading && 'animate-spin')}
              />
              Refresh
            </button>
          </div>
        </div>

        {orderbookError && (
          <div className='dashboard-card p-3 rounded-lg mb-4'>
            <p className='text-red-600 text-sm'>{orderbookError}</p>
          </div>
        )}

        {orderbookLoading ? (
          <div className='flex items-center justify-center h-64'>
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
          </div>
        ) : orderbook ? (
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            {/* Asks (Sell Orders) */}
            <div>
              <h3 className='text-lg font-medium mb-3 text-red-600'>
                Asks (Sell Orders)
              </h3>
              <div className='space-y-1'>
                <div className='grid grid-cols-3 gap-2 text-sm font-medium text-muted pb-2 border-b'>
                  <span>Price (USDT)</span>
                  <span className='text-right'>Size</span>
                  <span className='text-right'>Total</span>
                </div>
                {orderbook.asks
                  .slice(0, 10)
                  .reverse()
                  .map((ask, index) => {
                    const price = parseFloat(ask[0]);
                    const size = parseFloat(ask[1]);
                    const total = price * size;
                    return (
                      <div
                        key={index}
                        className='grid grid-cols-3 gap-2 text-sm py-1 hover:bg-transparent rounded px-2'
                      >
                        <span className='text-red-600 font-mono'>
                          {formatCurrency(price)}
                        </span>
                        <span className='text-right font-mono'>
                          {size.toFixed(4)}
                        </span>
                        <span className='text-right font-mono'>
                          {formatCurrency(total)}
                        </span>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Bids (Buy Orders) */}
            <div>
              <h3 className='text-lg font-medium mb-3 text-green-600'>
                Bids (Buy Orders)
              </h3>
              <div className='space-y-1'>
                <div className='grid grid-cols-3 gap-2 text-sm font-medium text-muted pb-2 border-b'>
                  <span>Price (USDT)</span>
                  <span className='text-right'>Size</span>
                  <span className='text-right'>Total</span>
                </div>
                {orderbook.bids.slice(0, 10).map((bid, index) => {
                  const price = parseFloat(bid[0]);
                  const size = parseFloat(bid[1]);
                  const total = price * size;
                  return (
                    <div
                      key={index}
                      className='grid grid-cols-3 gap-2 text-sm py-1 hover:bg-transparent rounded px-2'
                    >
                      <span className='text-green-600 font-mono'>
                        {formatCurrency(price)}
                      </span>
                      <span className='text-right font-mono'>
                        {size.toFixed(4)}
                      </span>
                      <span className='text-right font-mono'>
                        {formatCurrency(total)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className='flex items-center justify-center h-64 text-muted'>
            No orderbook data available
          </div>
        )}
      </div>

      {/* AI Analysis Section */}
      {summary && (
        <div className='dashboard-card p-6 rounded-lg'>
          <h2 className='text-xl font-semibold mb-4'>AI Analysis Prompt</h2>
          <p className='text-muted mb-4'>
            Use this prompt with ChatGPT, Claude, or other AI models along with
            the exported data:
          </p>
          <div className='dashboard-card p-4 rounded-lg mb-4'>
            <pre className='whitespace-pre-wrap text-sm'>
              {generateAIPrompt()}
            </pre>
          </div>
          <button
            onClick={copyAIPrompt}
            className='dashboard-button px-4 py-2 rounded-lg'
          >
            Copy AI Prompt
          </button>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
