import { shopifyGraphQL, ORDERS_QUERY } from "../../lib/shopify";

export default async function handler(req, res) {
  if (!checkAuth(req)) return res.status(401).json({ error: "Unauthorized" });

  try {
    const data = await shopifyGraphQL(ORDERS_QUERY, { first: 50 });
    const orders = data.orders.edges.map(({ node }) => ({
      id:           node.id,
      name:         node.name,
      createdAt:    node.createdAt,
      fulfillment:  node.displayFulfillmentStatus,
      payment:      node.displayFinancialStatus,
      total:        node.totalPriceSet.shopMoney,
      customer:     node.customer
                      ? `${node.customer.firstName} ${node.customer.lastName}`
                      : "Guest",
      returnStatus: node.returns.edges[0]?.node?.status ?? null,
    }));
    res.json({ orders });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

function checkAuth(req) {
  const token = req.cookies?.auth || req.headers["x-auth-token"];
  return token === process.env.APP_PASSWORD;
}
