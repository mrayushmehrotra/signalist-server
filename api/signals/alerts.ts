export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const alerts = [
    {
      id: '1',
      message: 'AAPL hit target price $195.00',
      type: 'success',
      timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString()
    },
    {
      id: '2',
      message: 'New BUY signal generated for NVDA',
      type: 'info',
      timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString()
    },
    {
      id: '3',
      message: 'Market volatility increased',
      type: 'warning',
      timestamp: new Date(Date.now() - 12 * 60 * 1000).toISOString()
    }
  ];

  res.status(200).json(alerts);
}