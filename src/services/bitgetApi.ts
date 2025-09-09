import axios from 'axios';

// Use local API routes to avoid CORS issues
const API_BASE_URL = '/api/bitget';

export interface CandleData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  quoteVolume: number;
}

export interface SymbolInfo {
  symbol: string;
  baseCoin: string;
  quoteCoin: string;
  minTradeAmount: string;
  maxTradeAmount: string;
  takerFeeRate: string;
  makerFeeRate: string;
  status: string;
}

export interface TickerData {
  symbol: string;
  high24h: string;
  low24h: string;
  close: string;
  quoteVol: string;
  baseVol: string;
  usdtVol: string;
  ts: string;
  buyOne: string;
  sellOne: string;
  bidSz: string;
  askSz: string;
  openUtc: string;
  changeUtc24h: string;
  change24h: string;
}

export interface OrderbookData {
  asks: [string, string][]; // [price, size]
  bids: [string, string][]; // [price, size]
  ts: string;
}

class BitgetApiService {
  private baseURL: string;

  constructor() {
    this.baseURL = API_BASE_URL;
  }

  // Map UI granularity values to API granularity values
  private mapGranularity(granularity: string): string {
    const granularityMap: { [key: string]: string } = {
      '1min': '1min',
      '5min': '5min',
      '15min': '15min',
      '1h': '1h',
      '4h': '4h',
      '1day': '1day',
      '1week': '1week',
      '1month': '1M',
    };
    return granularityMap[granularity] || granularity;
  }

  // Get all available symbols
  async getSymbols(): Promise<SymbolInfo[]> {
    try {
      const response = await axios.get(`${this.baseURL}/symbols`);
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching symbols:', error);
      throw new Error('Failed to fetch symbols');
    }
  }

  // Get 24hr ticker data for all symbols
  async getAllTickers(): Promise<TickerData[]> {
    try {
      const response = await axios.get(`${this.baseURL}/tickers`);
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching tickers:', error);
      throw new Error('Failed to fetch ticker data');
    }
  }

  // Get historical candlestick data
  async getHistoricalData(
    symbol: string,
    granularity: string = '1D', // 1m, 5m, 15m, 30m, 1H, 4H, 6H, 12H, 1D, 3D, 1W, 1M
    startTime?: string,
    endTime?: string,
    limit: number = 200
  ): Promise<CandleData[]> {
    try {
      const params: {
        symbol: string;
        granularity: string;
        limit: number;
        startTime?: string;
        endTime?: string;
      } = {
        symbol,
        granularity: this.mapGranularity(granularity),
        limit: Math.min(limit, 1000), // API limit is 1000
      };

      if (startTime) params.startTime = startTime;
      if (endTime) params.endTime = endTime;

      const response = await axios.get(`${this.baseURL}/candles`, {
        params,
      });

      const candles = response.data.data || [];

      return candles
        .map((candle: string[]) => ({
          timestamp: parseInt(candle[0]),
          open: parseFloat(candle[1]),
          high: parseFloat(candle[2]),
          low: parseFloat(candle[3]),
          close: parseFloat(candle[4]),
          volume: parseFloat(candle[5]),
          quoteVolume: parseFloat(candle[6]),
        }))
        .sort((a: CandleData, b: CandleData) => a.timestamp - b.timestamp);
    } catch (error) {
      console.error('Error fetching historical data:', error);
      throw new Error(`Failed to fetch historical data for ${symbol}`);
    }
  }

  // Get recent price data for a symbol
  async getRecentPrice(symbol: string): Promise<number> {
    try {
      const response = await axios.get(`${this.baseURL}/ticker`, {
        params: { symbol },
      });
      return parseFloat(response.data.data[0].lastPr);
    } catch (error) {
      console.error('Error fetching recent price:', error);
      throw new Error(`Failed to fetch recent price for ${symbol}`);
    }
  }

  // Get orderbook data for a symbol
  async getOrderbook(
    symbol: string,
    limit: number = 100
  ): Promise<OrderbookData> {
    try {
      const response = await axios.get(`${this.baseURL}/orderbook`, {
        params: {
          symbol,
          limit: Math.min(limit, 500), // API limit is 500
        },
      });
      return response.data.data;
    } catch (error) {
      console.error('Error fetching orderbook:', error);
      throw new Error(`Failed to fetch orderbook for ${symbol}`);
    }
  }

  // Helper method to get data for AI analysis
  async getDataForAI(
    symbol: string,
    days: number = 30,
    granularity: string = '1D'
  ): Promise<{
    symbol: string;
    data: CandleData[];
    summary: {
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
    };
  }> {
    // Calculate the proper date range
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - days * 24 * 60 * 60 * 1000);

    // Convert to milliseconds for the API
    const startTimeMs = startTime.getTime().toString();
    const endTimeMs = endTime.getTime().toString();

    // Calculate appropriate limit based on granularity and days
    let limit = 1000; // API maximum

    // Estimate how many data points we need based on granularity
    switch (granularity) {
      case '1min':
        limit = Math.min(days * 24 * 60, 1000); // 1 point per minute
        break;
      case '5min':
        limit = Math.min(days * 24 * 12, 1000); // 12 points per hour
        break;
      case '15min':
        limit = Math.min(days * 24 * 4, 1000); // 4 points per hour
        break;
      case '1h':
        limit = Math.min(days * 24, 1000); // 24 points per day
        break;
      case '4h':
        limit = Math.min(days * 6, 1000); // 6 points per day
        break;
      case '1day':
        limit = Math.min(days, 1000); // 1 point per day
        break;
      case '1week':
        limit = Math.min(Math.ceil(days / 7), 1000); // 1 point per week
        break;
      case '1month':
        limit = Math.min(Math.ceil(days / 30), 1000); // 1 point per month
        break;
      default:
        limit = Math.min(days, 1000);
    }

    let data = await this.getHistoricalData(
      symbol,
      granularity,
      startTimeMs,
      endTimeMs,
      limit
    );

    // If no data found for the specific time range, try to get recent data as fallback
    if (data.length === 0) {
      console.warn(
        `No data found for ${symbol} in specified time range, trying recent data...`
      );
      data = await this.getHistoricalData(
        symbol,
        granularity,
        undefined,
        undefined,
        Math.min(limit, 200)
      );
    }

    if (data.length === 0) {
      throw new Error(`No data available for ${symbol}`);
    }

    const startPrice = data[0].open;
    const endPrice = data[data.length - 1].close;
    const highestPrice = Math.max(...data.map(d => d.high));
    const lowestPrice = Math.min(...data.map(d => d.low));
    const totalVolume = data.reduce((sum, d) => sum + d.volume, 0);
    const priceChange = endPrice - startPrice;
    const priceChangePercent = (priceChange / startPrice) * 100;

    return {
      symbol,
      data,
      summary: {
        totalDays: data.length,
        startDate: new Date(data[0].timestamp).toISOString().split('T')[0],
        endDate: new Date(data[data.length - 1].timestamp)
          .toISOString()
          .split('T')[0],
        startPrice,
        endPrice,
        highestPrice,
        lowestPrice,
        totalVolume,
        priceChange,
        priceChangePercent,
      },
    };
  }

  // Export data in CSV format for AI analysis
  exportToCSV(data: CandleData[], symbol: string): string {
    const headers = [
      'Date',
      'Open',
      'High',
      'Low',
      'Close',
      'Volume',
      'Quote Volume',
    ];
    const rows = data.map(candle => [
      new Date(candle.timestamp).toISOString().split('T')[0],
      candle.open.toString(),
      candle.high.toString(),
      candle.low.toString(),
      candle.close.toString(),
      candle.volume.toString(),
      candle.quoteVolume.toString(),
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  // Export data in JSON format for AI analysis
  exportToJSON(data: CandleData[], symbol: string, summary?: object): string {
    return JSON.stringify(
      {
        symbol,
        exportDate: new Date().toISOString(),
        summary,
        data: data.map(candle => ({
          date: new Date(candle.timestamp).toISOString().split('T')[0],
          timestamp: candle.timestamp,
          open: candle.open,
          high: candle.high,
          low: candle.low,
          close: candle.close,
          volume: candle.volume,
          quoteVolume: candle.quoteVolume,
        })),
      },
      null,
      2
    );
  }
}

export const bitgetApi = new BitgetApiService();
export default bitgetApi;
