export default function handler(req, res) {
  const raw = req.headers["x-vercel-ip-country"];
  const value = Array.isArray(raw) ? raw[0] : raw || "";
  const country = /^[A-Za-z]{2}$/.test(value) ? value.toUpperCase() : null;
  res.status(200).json({ country });
}
