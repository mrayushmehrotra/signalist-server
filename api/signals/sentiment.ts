export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sentiment = {
    bullish: 75,
    neutral: 20,
    bearish: 5
  };

  res.status(200).json(sentiment);
}