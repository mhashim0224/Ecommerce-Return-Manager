import { shopifyGraphQL, ORDER_DETAIL_QUERY } from "../../../lib/shopify";

export default async function handler(req, res) {
  if (!checkAuth(req)) return res.status(401).json({ error: "Unauthorized" });

  const gid = `gid://shopify/Order/${req.query.id}`;

  try {
    const data  = await shopifyGraphQL(ORDER_DETAIL_QUERY, { id: gid });
    const order = data.order;

    if (!order) return res.status(404).json({ error: "Order not found" });

    res.json({ order });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

function checkAuth(req) {
  const token = req.cookies?.auth || req.headers["x-auth-token"];
  return token === process.env.APP_PASSWORD;
}
