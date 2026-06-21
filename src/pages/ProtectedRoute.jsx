import { useState, useEffect } from "react";

const ACCESS_PASSWORD = "lastseen2026"; // change this to whatever you want

function ProtectedRoute({ children, label }) {
  const [authenticated, setAuthenticated] = useState(false);
  const [input, setInput] = useState("");
  const [error, setError] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem("lastSeenAuth") === "true") {
      setAuthenticated(true);
    }
  }, []);

  const handleSubmit = () => {
    if (input === ACCESS_PASSWORD) {
      sessionStorage.setItem("lastSeenAuth", "true");
      setAuthenticated(true);
      setError(false);
    } else {
      setError(true);
    }
  };

  if (authenticated) {
    return children;
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#0f172a",
      }}
    >
      <div
        style={{
          maxWidth: 360,
          width: "100%",
          padding: "36px 32px",
          backgroundColor: "#1e293b",
          borderRadius: 16,
          boxShadow: "0 10px 40px rgba(0,0,0,0.3)",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 40, marginBottom: 8 }}>🔒</div>
        <h2 style={{ margin: "0 0 4px", color: "white" }}>{label} Access</h2>
        <p style={{ color: "#94a3b8", fontSize: 14, marginBottom: 24 }}>
          Enter the access code to continue
        </p>
        <input
          type="password"
          autoFocus
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          placeholder="Access code"
          style={{
            padding: "12px 14px",
            fontSize: 16,
            width: "100%",
            borderRadius: 8,
            border: error ? "1px solid #dc2626" : "1px solid #334155",
            backgroundColor: "#0f172a",
            color: "white",
            outline: "none",
            boxSizing: "border-box",
          }}
        />
        {error && (
          <p style={{ color: "#f87171", fontSize: 13, marginTop: 8 }}>
            Incorrect code. Try again.
          </p>
        )}
        <button
          onClick={handleSubmit}
          style={{
            marginTop: 16,
            padding: "12px 24px",
            fontSize: 15,
            width: "100%",
            borderRadius: 8,
            border: "none",
            backgroundColor: "#2563eb",
            color: "white",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          Enter
        </button>
      </div>
    </div>
  );
}

export default ProtectedRoute;