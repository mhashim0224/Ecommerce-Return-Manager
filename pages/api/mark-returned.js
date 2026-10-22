import { shopifyGraphQL, RETURN_CREATE, RETURN_CLOSE, RESTOCK_MUTATION } from "../../lib/shopify";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!checkAuth(req))       return res.status(401).json({ error: "Unauthorized" });

  const { orderId, fulfillmentLineItemId, quantity, restock } = req.body;

  if (!orderId || !fulfillmentLineItemId || !quantity) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const createData = await shopifyGraphQL(RETURN_CREATE, {
      input: {
        orderId,
        returnLineItems: [{
          fulfillmentLineItemId,
          quantity:     parseInt(quantity),
          returnReason: "UNWANTED",
          customerNote: "Customer refused delivery",
        }],
      },
    });

    const createErrors = createData.returnCreate?.userErrors ?? [];
    if (createErrors.length) {
      return res.status(400).json({ error: createErrors.map((e) => e.message).join(", ") });
    }

    const returnId = createData.returnCreate?.return?.id;
    if (!returnId) return res.status(500).json({ error: "Return could not be created" });

    const closeData = await shopifyGraphQL(RETURN_CLOSE, { id: returnId });
    const closeErrors = closeData.returnClose?.userErrors ?? [];
    if (closeErrors.length) {
      return res.json({ success: true, warning: "Return created but close failed", returnId });
    }

    if (restock) {
      const restockData = await shopifyGraphQL(RESTOCK_MUTATION, {
        input: {
          returnId,
          returnRefundLineItems: [{
            returnLineItemId: fulfillmentLineItemId,
            quantity: parseInt(quantity),
          }],
          refundShipping: { fullRefund: false },
          transactions: [],
        },
      });

      const restockErrors = restockData.returnRefundCreate?.userErrors ?? [];
      if (restockErrors.length) {
        return res.json({
          success: true,
          warning: `Return done but restock failed: ${restockErrors.map((e) => e.message).join(", ")}`,
          returnId,
        });
      }
    }

    return res.json({ success: true, returnId });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

function checkAuth(req) {
  const token = req.cookies?.auth || req.headers["x-auth-token"];
  return token === process.env.APP_PASSWORD;
}
