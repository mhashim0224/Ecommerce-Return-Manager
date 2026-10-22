export default function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { password } = req.body;

  if (password !== process.env.APP_PASSWORD) {
    return res.status(401).json({ error: "Wrong password" });
  }

  res.setHeader("Set-Cookie", `auth=${password}; HttpOnly; Path=/; Max-Age=${60*60*24*7}; SameSite=Lax`);
  res.json({ ok: true });
}
