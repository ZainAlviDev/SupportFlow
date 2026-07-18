import { StrictMode, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { WidgetApp } from "./components/WidgetApp";

const DEFAULT_API = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000/api/v1";
const DEFAULT_SIGNALR = import.meta.env.VITE_SIGNALR_URL ?? "http://localhost:5000";

function TestHarness() {
  const [apiKey, setApiKey] = useState(() => localStorage.getItem("sf_test_api_key") ?? "");
  const [started, setStarted] = useState(false);

  const options = useMemo(
    () => ({
      apiKey,
      apiBaseUrl: DEFAULT_API,
      signalrUrl: DEFAULT_SIGNALR,
    }),
    [apiKey],
  );

  return (
    <div
      style={{
        minHeight: "100vh",
        margin: 0,
        fontFamily: 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif',
        background:
          "radial-gradient(circle at top right, rgba(16,185,129,0.18), transparent 40%), linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%)",
        color: "#0f172a",
      }}
    >
      <main style={{ maxWidth: 720, margin: "0 auto", padding: "48px 20px" }}>
        <p style={{ letterSpacing: "0.08em", textTransform: "uppercase", fontSize: 12, color: "#64748b" }}>
          Module 4 · Widget test page
        </p>
        <h1 style={{ fontSize: 36, margin: "8px 0 12px" }}>SupportFlow chat widget</h1>
        <p style={{ color: "#475569", lineHeight: 1.6, maxWidth: 560 }}>
          Paste a widget API key from Dashboard → Settings → Widget. Messages you send here should
          appear in the agent inbox in real time.
        </p>

        <div
          style={{
            marginTop: 28,
            background: "white",
            borderRadius: 16,
            padding: 20,
            boxShadow: "0 10px 30px rgba(15,23,42,0.08)",
          }}
        >
          <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
            API key
          </label>
          <input
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="pk_live_..."
            style={{
              width: "100%",
              boxSizing: "border-box",
              border: "1px solid #e2e8f0",
              borderRadius: 10,
              padding: "12px 14px",
              fontSize: 14,
            }}
          />
          <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
            <button
              type="button"
              onClick={() => {
                localStorage.setItem("sf_test_api_key", apiKey.trim());
                setStarted(Boolean(apiKey.trim()));
              }}
              style={{
                border: "none",
                background: "#10b981",
                color: "white",
                borderRadius: 10,
                padding: "10px 16px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Launch widget
            </button>
            <button
              type="button"
              onClick={() => {
                setStarted(false);
                localStorage.removeItem("sf_test_api_key");
                setApiKey("");
              }}
              style={{
                border: "1px solid #e2e8f0",
                background: "white",
                borderRadius: 10,
                padding: "10px 16px",
                cursor: "pointer",
              }}
            >
              Reset
            </button>
          </div>
          <p style={{ marginTop: 12, fontSize: 12, color: "#64748b" }}>
            API: {DEFAULT_API} · SignalR: {DEFAULT_SIGNALR}
          </p>
        </div>
      </main>

      {started && apiKey.trim() ? (
        <StrictMode>
          <WidgetApp options={options} />
        </StrictMode>
      ) : null}
    </div>
  );
}

const root = document.getElementById("root");
if (root) {
  createRoot(root).render(<TestHarness />);
}
