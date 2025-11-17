export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const signals = [
    {
      id: '1',
      symbol: 'AAPL',
      type: 'BUY',
      confidence: 92,
      price: 185.43,
      target: 195.00,
      change: '+2.4%',
      timestamp: new Date().toISOString()
    },
    {
      id: '2',
      symbol: 'TSLA',
      type: 'SELL',
      confidence: 88,
      price: 218.45,
      target: 205.00,
      change: '-1.8%',
      timestamp: new Date().toISOString()
    },
    {
      id: '3',
      symbol: 'NVDA',
      type: 'BUY',
      confidence: 95,
      price: 445.67,
      target: 475.00,
      change: '+3.1%',
      timestamp: new Date().toISOString()
    }
  ];

  res.status(200).json(signals);
}