export default async function handler(req, res) {
  const { code, shop } = req.query;

  if (!code || !shop) {
    return res.status(400).send("Missing code or shop");
  }

  try {
    const tokenRes = await fetch(`https://${shop}/admin/oauth/access_token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id:     process.env.SHOPIFY_API_KEY,
        client_secret: process.env.SHOPIFY_API_SECRET,
        code,
      }),
    });

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    if (!accessToken) {
      return res.status(500).send("Failed to get access token: " + JSON.stringify(tokenData));
    }

    return res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Token Retrieved</title>
        <style>
          body { font-family: sans-serif; max-width: 600px; margin: 60px auto; padding: 20px; }
          .token { background: #f0fdf4; border: 2px solid #10b981; border-radius: 8px; padding: 20px; word-break: break-all; font-family: monospace; font-size: 14px; }
          h1 { color: #059669; }
          .step { background: #f9fafb; border-radius: 8px; padding: 16px; margin: 16px 0; }
          code { background: #e5e7eb; padding: 2px 6px; border-radius: 4px; }
        </style>
      </head>
      <body>
        <h1>✅ Access Token Retrieved!</h1>
        <p>Copy this token and add it to your Vercel environment variables:</p>
        <div class="token">${accessToken}</div>
        <div class="step">
          <strong>Next step:</strong><br/>
          1. Copy the token above<br/>
          2. Go to <strong>Vercel → Your Project → Settings → Environment Variables</strong><br/>
          3. Add: <code>SHOPIFY_ADMIN_ACCESS_TOKEN</code> = (paste the token)<br/>
          4. Click <strong>Save</strong> → <strong>Redeploy</strong>
        </div>
      </body>
      </html>
    `);

  } catch (err) {
    return res.status(500).send("Error: " + err.message);
  }
}
