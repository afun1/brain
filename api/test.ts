export default function handler(req: any, res: any) {
  return res.status(200).json({ 
    message: "Hello from Vercel!",
    timestamp: new Date().toISOString()
  });
}
