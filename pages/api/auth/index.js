export default function handler(req, res) {
  const shop   = req.query.shop || process.env.SHOPIFY_STORE_DOMAIN;
  const apiKey = process.env.SHOPIFY_API_KEY;
  const scopes = "read_orders,write_orders,read_returns,write_returns,read_inventory,write_inventory";
  const redirectUri = `${process.env.SHOPIFY_APP_URL}/api/auth/callback`;

  const installUrl =
    `https://${shop}/admin/oauth/authorize` +
    `?client_id=${apiKey}` +
    `&scope=${scopes}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}`;

  res.redirect(installUrl);
}
