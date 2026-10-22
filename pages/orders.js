import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";

const STATUS_BADGE = {
  FULFILLED:   { cls: "badge-success", label: "Fulfilled" },
  UNFULFILLED: { cls: "badge-warning", label: "Unfulfilled" },
  PARTIAL:     { cls: "badge-warning", label: "Partial" },
};

const RETURN_BADGE = {
  OPEN:      { cls: "badge-warning", label: "Return Open" },
  CLOSED:    { cls: "badge-success", label: "Returned ✓" },
  CANCELLED: { cls: "badge-danger",  label: "Cancelled" },
};

export default function OrdersPage() {
  const [orders,  setOrders]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");
  const [search,  setSearch]  = useState("");
  const router = useRouter();

  useEffect(() => {
    fetch("/api/orders")
      .then((r) => {
        if (r.status === 401) { router.push("/"); return null; }
        return r.json();
      })
      .then((data) => {
        if (!data) return;
        if (data.error) setError(data.error);
        else setOrders(data.orders);
        setLoading(false);
      })
      .catch((e) => { setError(e.message); setLoading(false); });
  }, []);

  const filtered = orders.filter((o) => {
    const q = search.toLowerCase();
    return o.name.toLowerCase().includes(q) || o.customer.toLowerCase().includes(q);
  });

  const openReturns   = orders.filter((o) => o.returnStatus === "OPEN").length;
  const closedReturns = orders.filter((o) => o.returnStatus === "CLOSED").length;
  const fulfilled     = orders.filter((o) => o.fulfillment === "FULFILLED").length;

  return (
    <>
      <Head><title>Orders — Nur Return Manager</title></Head>
      <nav className="navbar">
        <div className="container inner">
          <div className="brand">📦 <span>Nur</span> Return Manager</div>
          <button className="btn btn-ghost btn-sm" onClick={() => {
            document.cookie = "auth=;max-age=0;path=/";
            router.push("/");
          }}>Log out</button>
        </div>
      </nav>

      <div className="container" style={{ paddingTop: 28, paddingBottom: 40 }}>
        <div className="grid-stats mb-4">
          {[
            { label: "Open Returns",    value: openReturns,   color: openReturns ? "#F59E0B" : "#10B981" },
            { label: "Completed",       value: closedReturns, color: "#10B981" },
            { label: "Fulfilled Orders",value: fulfilled,     color: "#8B5CF6" },
            { label: "Total Orders",    value: orders.length, color: "#6B7280" },
          ].map((s) => (
            <div className="card" key={s.label} style={{ padding: "16px 20px" }}>
              <div className="muted" style={{ fontSize: 12, marginBottom: 4 }}>{s.label}</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        <div className="card" style={{ padding: 0 }}>
          <div className="flex items-center justify-between" style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)" }}>
            <h2 style={{ fontSize: 16, fontWeight: 600 }}>All Orders</h2>
            <input
              type="text"
              placeholder="Search by order # or customer…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: 240, padding: "7px 12px", fontSize: 13 }}
            />
          </div>

          {loading && <div style={{ padding: 40, textAlign: "center", color: "var(--muted)" }}>Loading orders…</div>}
          {error   && <div className="alert alert-error" style={{ margin: 16 }}>{error}</div>}

          {!loading && !error && (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Order</th><th>Customer</th><th>Date</th>
                    <th>Total</th><th>Fulfillment</th><th>Return</th><th></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 && (
                    <tr><td colSpan={7} style={{ textAlign: "center", color: "var(--muted)", padding: 32 }}>No orders found</td></tr>
                  )}
                  {filtered.map((order) => {
                    const fb = STATUS_BADGE[order.fulfillment] || { cls: "badge-neutral", label: order.fulfillment };
                    const rb = order.returnStatus ? RETURN_BADGE[order.returnStatus] : null;
                    const canReturn = order.fulfillment === "FULFILLED" && !order.returnStatus;
                    const numericId = order.id.replace("gid://shopify/Order/", "");
                    return (
                      <tr key={order.id}>
                        <td><Link href={`/orders/${numericId}`} style={{ fontWeight: 600, color: "var(--brand)" }}>{order.name}</Link></td>
                        <td>{order.customer}</td>
                        <td className="muted">{new Date(order.createdAt).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" })}</td>
                        <td style={{ fontWeight: 500 }}>{order.total.currencyCode} {parseFloat(order.total.amount).toLocaleString()}</td>
                        <td><span className={`badge ${fb.cls}`}>{fb.label}</span></td>
                        <td>{rb ? <span className={`badge ${rb.cls}`}>{rb.label}</span> : <span className="muted">—</span>}</td>
                        <td>
                          <Link href={`/orders/${numericId}`}>
                            <button className={`btn btn-sm ${canReturn ? "btn-danger" : "btn-ghost"}`}>
                              {canReturn ? "Mark Returned" : "View"}
                            </button>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
