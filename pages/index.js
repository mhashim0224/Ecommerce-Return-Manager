import { useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/login", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ password }),
    });

    if (res.ok) {
      router.push("/orders");
    } else {
      setError("Wrong password. Please try again.");
      setLoading(false);
    }
  };

  return (
    <>
      <Head><title>Nur Return Manager — Login</title></Head>
      <div style={{
        minHeight: "100vh", display: "flex",
        alignItems: "center", justifyContent: "center",
        background: "linear-gradient(135deg, #EDE9FE 0%, #F9FAFB 60%)",
      }}>
        <div className="card" style={{ width: "100%", maxWidth: 380, padding: 32 }}>
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <div style={{
              width: 52, height: 52, borderRadius: 14,
              background: "#8B5CF6", display: "inline-flex",
              alignItems: "center", justifyContent: "center",
              fontSize: 24, marginBottom: 12,
            }}>📦</div>
            <h1 style={{ fontSize: 20, fontWeight: 700 }}>Nur Return Manager</h1>
            <p className="muted" style={{ marginTop: 4, fontSize: 13 }}>
              Backend tool for the Nur by Juggun team
            </p>
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handleLogin}>
            <div className="mb-4">
              <label htmlFor="password">Team Password</label>
              <input
                id="password"
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoFocus
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: "100%" }} disabled={loading}>
              {loading ? <><span className="spinner" /> Logging in…</> : "Log In"}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
