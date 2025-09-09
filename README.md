# CoinAI Analytics - AI Integration & Backtesting Guide

## Overview

This dashboard provides historical cryptocurrency data from Bitget exchange that can be used for AI-powered analysis and backtesting. The data is formatted specifically for use with AI models like ChatGPT, Claude, and other language models.

## Features

### 📊 Data Visualization

- Interactive price charts with multiple timeframes
- Real-time price data and market statistics
- Support for 50+ cryptocurrency pairs (USDT pairs)
- Multiple granularity options (1H, 4H, 1D, 1W)

### 📈 Data Export

- **CSV Format**: Perfect for spreadsheet analysis and traditional backtesting tools
- **JSON Format**: Structured data ideal for programmatic analysis and AI consumption
- **AI-Ready Prompts**: Pre-formatted prompts for immediate use with AI models

### 🔧 Customization

- Flexible time ranges (7 days to 1 year)
- Multiple granularity settings
- Real-time data refresh
- Comprehensive market summaries

## How to Use with AI Models

### Step 1: Select Your Data

1. Choose a cryptocurrency pair (e.g., BTCUSDT, ETHUSDT)
2. Select your desired time range (7 days to 1 year)
3. Choose granularity based on your analysis needs:
   - **1H**: For short-term trading strategies
   - **4H**: For swing trading analysis
   - **1D**: For medium-term trend analysis
   - **1W**: For long-term investment strategies

### Step 2: Export Data

- **For AI Analysis**: Use the "Copy AI Prompt" button to get a pre-formatted prompt
- **For Detailed Analysis**: Export CSV or JSON files for comprehensive data
- **For Programming**: Use JSON format for custom analysis scripts

### Step 3: AI Analysis Workflow

#### With ChatGPT/Claude:

1. Copy the AI prompt from the dashboard
2. Attach the exported CSV/JSON file
3. Ask for specific analysis:
   - Technical analysis
   - Support/resistance levels
   - Trading signals
   - Risk assessment
   - Price predictions

#### Sample AI Prompts:

**Technical Analysis:**

```
Analyze this cryptocurrency data and provide:
1. Current trend direction and strength
2. Key support and resistance levels
3. Technical indicators analysis (RSI, MACD equivalent)
4. Entry and exit points for trades
5. Risk management recommendations
```

**Backtesting Strategy:**

```
Using this historical data, backtest a simple moving average crossover strategy:
1. Calculate 20-day and 50-day moving averages
2. Generate buy/sell signals
3. Calculate returns and maximum drawdown
4. Provide performance metrics
5. Suggest optimizations
```

**Market Sentiment:**

```
Analyze the price action and volume data to determine:
1. Market sentiment (bullish/bearish/neutral)
2. Volatility patterns
3. Volume-price relationship
4. Potential market turning points
5. Comparison with broader market trends
```

## Data Structure

### CSV Format

```
Date,Open,High,Low,Close,Volume,Quote Volume
2024-01-01,42000.50,43500.00,41800.25,43200.75,1250.45,52500000.00
```

### JSON Format

```json
{
  "symbol": "BTCUSDT",
  "exportDate": "2024-01-15T10:30:00.000Z",
  "summary": {
    "totalDays": 30,
    "startDate": "2023-12-16",
    "endDate": "2024-01-15",
    "startPrice": 42000.5,
    "endPrice": 43200.75,
    "priceChange": 1200.25,
    "priceChangePercent": 2.86
  },
  "data": [
    {
      "date": "2023-12-16",
      "timestamp": 1702684800000,
      "open": 42000.5,
      "high": 43500.0,
      "low": 41800.25,
      "close": 43200.75,
      "volume": 1250.45,
      "quoteVolume": 52500000.0
    }
  ]
}
```

## Advanced AI Integration

### 1. Multi-Asset Analysis

- Export data for multiple cryptocurrencies
- Compare performance across different assets
- Identify correlation patterns
- Portfolio optimization strategies

### 2. Custom Indicators

Ask AI to calculate:

- RSI (Relative Strength Index)
- MACD (Moving Average Convergence Divergence)
- Bollinger Bands
- Fibonacci retracements
- Custom momentum indicators

### 3. Risk Management

- Position sizing recommendations
- Stop-loss and take-profit levels
- Portfolio diversification strategies
- Maximum drawdown analysis

### 4. Market Regime Detection

- Bull/bear market identification
- Volatility clustering analysis
- Trend strength measurement
- Market cycle analysis

## Best Practices

### Data Selection

- **Short-term trading**: Use 1H or 4H data with 7-30 day ranges
- **Swing trading**: Use 4H or 1D data with 30-90 day ranges
- **Long-term investing**: Use 1D or 1W data with 180+ day ranges

### AI Interaction

- Be specific about your trading style and risk tolerance
- Ask for multiple scenarios (bullish, bearish, neutral)
- Request specific entry/exit criteria
- Always ask for risk management recommendations

### Backtesting Tips

- Include transaction costs in calculations
- Consider slippage for larger positions
- Test strategies across different market conditions
- Validate results with out-of-sample data

## Limitations & Disclaimers

⚠️ **Important Notes:**

- Historical data does not guarantee future performance
- AI analysis should supplement, not replace, your own research
- Always implement proper risk management
- Consider market conditions and external factors
- Cryptocurrency markets are highly volatile and risky

## Technical Details

### API Endpoints Used

- Bitget Spot API v2
- Real-time market data
- Historical candlestick data
- Symbol information

### Data Refresh

- Manual refresh available
- Data is fetched in real-time from Bitget
- No caching - always current market data

### Supported Timeframes

- 1 minute to 1 week granularity
- Up to 1 year of historical data
- Configurable date ranges

## Getting Started

1. **Launch the Dashboard**: Open http://localhost:3000
2. **Select a Symbol**: Choose from 50+ available cryptocurrency pairs
3. **Configure Settings**: Set time range and granularity
4. **Analyze Data**: View charts and market summary
5. **Export for AI**: Use CSV/JSON export or copy AI prompt
6. **Get Insights**: Paste into your preferred AI model

## Development

This is a [Next.js](https://nextjs.org) project. To run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Support & Updates

This dashboard uses the latest Bitget API and is designed to be easily extensible. You can modify the code to add new features, indicators, or export formats as needed.

For the most accurate and up-to-date market data, always verify important trading decisions with multiple sources and consider consulting with financial professionals.
