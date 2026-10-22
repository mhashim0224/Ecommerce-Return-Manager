import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";

const RETURN_STATUS = {
  OPEN:   { cls: "badge-warning", label: "Return Open — waiting to be processed" },
  CLOSED: { cls: "badge-success", label: "Return Completed ✓ Inventory restocked" },
};

export default function OrderDetailPage() {
  const router = useRouter();
  const { id }  = router.query;

  const [order,    setOrder]    = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState("");
  const [restock,  setRestock]  = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result,   setResult]   = useState(null);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/order/${id}`)
      .then((r) => {
        if (r.status === 401) { router.push("/"); return null; }
        return r.json();
      })
      .then((data) => {
        if (!data) return;
        if (data.error) setError(data.error);
        else setOrder(data.order);
        setLoading(false);
      })
      .catch((e) => { setError(e.message); setLoading(false); });
  }, [id]);

  const handleMarkReturned = async (item) => {
    setSubmitting(true);
    setResult(null);

    const res = await fetch("/api/mark-returned", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orderId:               order.id,
        fulfillmentLineItemId: item.id,
        quantity:              item.quantity,
        restock,
      }),
    });

    const data = await res.json();
    setResult(data);
    setSubmitting(false);

    if (data.success) {
      setTimeout(() => {
        fetch(`/api/order/${id}`)
          .then((r) => r.json())
          .then((d) => { if (d.order) setOrder(d.order); });
      }, 1000);
    }
  };

  const fulfillmentItems = order?.fulfillments?.[0]?.fulfillmentLineItems?.edges ?? [];
  const returnStatus     = order?.returns?.edges?.[0]?.node?.status;
  const hasReturn        = !!returnStatus;
  const tracking         = order?.fulfillments?.[0]?.trackingInfo?.[0];

  return (
    <>
      <Head><title>{order ? `${order.name} — Nur Return Manager` : "Order"}</title></Head>

      <nav className="navbar">
        <div className="container inner">
          <div className="brand">📦 <span>Nur</span> Return Manager</div>
          <Link href="/orders"><button className="btn btn-ghost btn-sm">← Back to Orders</button></Link>
        </div>
      </nav>

      <div className="container" style={{ paddingTop: 28, paddingBottom: 40 }}>

        {loading && <div style={{ textAlign: "center", padding: 60, color: "var(--muted)" }}>Loading order…</div>}
        {error   && <div className="alert alert-error">{error}</div>}

        {order && (
          <>
            {result?.success && !result.warning && (
              <div className="alert alert-success">
                ✅ Return marked successfully! {restock ? "Inventory has been restocked." : ""}
              </div>
            )}
            {result?.warning && (
              <div className="alert alert-warning">⚠️ {result.warning}</div>
            )}
            {result?.error && (
              <div className="alert alert-error">❌ {result.error}</div>
            )}

            {hasReturn && (
              <div className={`alert ${returnStatus === "CLOSED" ? "alert-success" : "alert-warning"}`}>
                {RETURN_STATUS[returnStatus]?.label ?? `Return status: ${returnStatus}`}
              </div>
            )}

            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 style={{ fontSize: 22, fontWeight: 700 }}>{order.name}</h1>
                <p className="muted" style={{ marginTop: 4 }}>
                  {order.customer
                    ? `${order.customer.firstName} ${order.customer.lastName}`
                    : "Guest order"
                  }
                  {order.customer?.email && ` · ${order.customer.email}`}
                </p>
              </div>
              <a
                href={`https://admin.shopify.com/store/nur-by-juggun/orders/${id}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <button className="btn btn-ghost btn-sm">View in Shopify ↗</button>
              </a>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 16, marginBottom: 20 }}>
              {[
                { label: "Date",    value: new Date(order.createdAt).toLocaleDateString("en-PK", { day: "numeric", month: "long", year: "numeric" }) },
                { label: "Fulfillment", value: order.displayFulfillmentStatus },
                { label: "Payment",    value: order.displayFinancialStatus },
                { label: "Total",  value: `${order.totalPriceSet?.shopMoney?.currencyCode} ${parseFloat(order.totalPriceSet?.shopMoney?.amount || 0).toLocaleString()}` },
                ...(tracking ? [{ label: `Tracking (${tracking.company})`, value: tracking.number }] : []),
              ].map((item) => (
                <div className="card" key={item.label} style={{ padding: "14px 16px" }}>
                  <div className="muted" style={{ fontSize: 12, marginBottom: 3 }}>{item.label}</div>
                  <div style={{ fontWeight: 600 }}>{item.value}</div>
                </div>
              ))}
            </div>

            <div className="card" style={{ padding: 0 }}>
              <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)" }}>
                <h2 style={{ fontSize: 16, fontWeight: 600 }}>Fulfilled Items</h2>
              </div>

              {fulfillmentItems.length === 0 ? (
                <div style={{ padding: 32, textAlign: "center", color: "var(--muted)" }}>
                  This order has no fulfilled items — returns can only be created on fulfilled orders.
                </div>
              ) : (
                <div style={{ padding: "0 20px" }}>

                  {!hasReturn && (
                    <div style={{
                      margin: "16px 0", padding: "12px 16px",
                      background: "var(--bg)", borderRadius: 8,
                      display: "flex", alignItems: "center", gap: 10
                    }}>
                      <input
                        type="checkbox"
                        id="restock"
                        checked={restock}
                        onChange={(e) => setRestock(e.target.checked)}
                        style={{ width: 16, height: 16, cursor: "pointer" }}
                      />
                      <label htmlFor="restock" style={{ cursor: "pointer", marginBottom: 0, fontWeight: 400 }}>
                        <strong>Restock inventory</strong> — add returned quantity back to Shopify stock automatically
                      </label>
                    </div>
                  )}

                  {fulfillmentItems.map(({ node: item }) => {
                    const image = item.lineItem.variant?.image?.url;
                    const stock = item.lineItem.variant?.inventoryQuantity;
                    const sku   = item.lineItem.variant?.sku;

                    return (
                      <div key={item.id} style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        gap: 16, padding: "16px 0", borderBottom: "1px solid var(--border)"
                      }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                          {image && (
                            <img
                              src={image}
                              alt={item.lineItem.title}
                              style={{ width: 52, height: 52, borderRadius: 8, objectFit: "cover", border: "1px solid var(--border)" }}
                            />
                          )}
                          <div>
                            <div style={{ fontWeight: 600, marginBottom: 4 }}>{item.lineItem.title}</div>
                            <div className="muted" style={{ fontSize: 13, display: "flex", gap: 12 }}>
                              <span>Qty: {item.quantity}</span>
                              {sku && <span>SKU: {sku}</span>}
                              {stock != null && (
                                <span>
                                  Stock: {stock}
                                  {restock && !hasReturn && (
                                    <span style={{ color: "var(--success)", fontWeight: 500 }}>
                                      {" → "}{stock + item.quantity}
                                    </span>
                                  )}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {hasReturn ? (
                          <span className={`badge ${returnStatus === "CLOSED" ? "badge-success" : "badge-warning"}`}>
                            {returnStatus === "CLOSED" ? "✓ Returned" : "Return Open"}
                          </span>
                        ) : (
                          <button
                            className="btn btn-danger"
                            disabled={submitting}
                            onClick={() => handleMarkReturned(item)}
                          >
                            {submitting
                              ? <><span className="spinner" /> Processing…</>
                              : "Mark as Returned"
                            }
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </>
        )}
      </div>
    </>
  );
}
