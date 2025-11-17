export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const stats = {
    winRate: 87,
    totalPnL: 2450,
    totalSignals: 23,
    successfulSignals: 20
  };

  res.status(200).json(stats);
}