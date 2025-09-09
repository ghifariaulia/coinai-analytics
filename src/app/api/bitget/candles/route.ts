import { NextRequest, NextResponse } from 'next/server';

// Map UI granularity values to API granularity values
function mapGranularity(granularity: string): string {
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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');
    const granularity = mapGranularity(searchParams.get('granularity') || '1D');
    const startTime = searchParams.get('startTime');
    const endTime = searchParams.get('endTime');
    const limit = searchParams.get('limit') || '200';

    if (!symbol) {
      return NextResponse.json(
        { error: 'Symbol parameter is required' },
        { status: 400 }
      );
    }

    // Build query parameters for Bitget API
    const params = new URLSearchParams({
      symbol,
      granularity,
      limit: Math.min(parseInt(limit), 1000).toString(), // API limit is 1000
    });

    // Convert timestamps to seconds if they're in milliseconds
    if (startTime) {
      const startTimeNum = parseInt(startTime);
      const startTimeSeconds =
        startTimeNum > 9999999999
          ? Math.floor(startTimeNum / 1000)
          : startTimeNum;
      params.append('startTime', startTimeSeconds.toString());
    }
    if (endTime) {
      const endTimeNum = parseInt(endTime);
      const endTimeSeconds =
        endTimeNum > 9999999999 ? Math.floor(endTimeNum / 1000) : endTimeNum;
      params.append('endTime', endTimeSeconds.toString());
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

    const response = await fetch(
      `https://api.bitget.com/api/v2/spot/market/candles?${params}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (compatible; BitgetDashboard/1.0)',
        },
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Bitget API error response:', errorText);
      console.error(
        'Request URL:',
        `https://api.bitget.com/api/v2/spot/market/candles?${params}`
      );
      throw new Error(
        `HTTP error! status: ${response.status}, response: ${errorText}`
      );
    }

    const data = await response.json();

    return NextResponse.json(data, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  } catch (error) {
    console.error('Error fetching candles:', error);
    return NextResponse.json(
      { error: 'Failed to fetch historical data' },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
