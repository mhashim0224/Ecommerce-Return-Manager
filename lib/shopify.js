/**
 * Shopify Admin GraphQL client
 * Uses the custom app access token — no OAuth needed.
 */
const SHOPIFY_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN;
const ACCESS_TOKEN   = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;
const API_VERSION    = "2024-10";
const ENDPOINT       = `https://${SHOPIFY_DOMAIN}/admin/api/${API_VERSION}/graphql.json`;

export async function shopifyGraphQL(query, variables = {}) {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type":              "application/json",
      "X-Shopify-Access-Token":    ACCESS_TOKEN,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!res.ok) {
    throw new Error(`Shopify API error: ${res.status} ${res.statusText}`);
  }

  const json = await res.json();

  if (json.errors?.length) {
    throw new Error(json.errors.map((e) => e.message).join(", "));
  }

  return json.data;
}

// ── Queries & Mutations ────────────────────────────────────────────────────────

export const ORDERS_QUERY = `
  query getOrders($first: Int!, $after: String) {
    orders(first: $first, after: $after, sortKey: CREATED_AT, reverse: true) {
      pageInfo { hasNextPage endCursor }
      edges {
        node {
          id
          name
          createdAt
          displayFulfillmentStatus
          displayFinancialStatus
          totalPriceSet { shopMoney { amount currencyCode } }
          customer { firstName lastName }
          returns(first: 1) {
            edges { node { id status } }
          }
        }
      }
    }
  }
`;

export const ORDER_DETAIL_QUERY = `
  query getOrder($id: ID!) {
    order(id: $id) {
      id
      name
      createdAt
      displayFulfillmentStatus
      displayFinancialStatus
      totalPriceSet { shopMoney { amount currencyCode } }
      customer { firstName lastName email phone }
      shippingAddress { address1 city province country }
      fulfillments {
        trackingInfo { company number url }
        fulfillmentLineItems(first: 10) {
          edges {
            node {
              id
              quantity
              lineItem {
                title
                variant {
                  id
                  sku
                  inventoryQuantity
                  image { url }
                }
              }
            }
          }
        }
      }
      returns(first: 5) {
        edges { node { id status } }
      }
    }
  }
`;

export const RETURN_CREATE = `
  mutation returnCreate($input: ReturnInput!) {
    returnCreate(input: $input) {
      return { id status }
      userErrors { field message }
    }
  }
`;

export const RETURN_CLOSE = `
  mutation returnClose($id: ID!) {
    returnClose(id: $id) {
      return { id status }
      userErrors { field message }
    }
  }
`;

export const RESTOCK_MUTATION = `
  mutation returnRefundCreate($input: ReturnRefundInput!) {
    returnRefundCreate(input: $input) {
      returnRefund { id }
      userErrors { field message }
    }
  }
`;
