import { useNavigate } from "react-router-dom";

function Home() {
  const navigate = useNavigate();

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#0f172a",
        padding: 20,
      }}
    >
      <div style={{ maxWidth: 420, width: "100%", textAlign: "center" }}>
        <svg width="56" height="56" viewBox="0 0 24 24" fill="none" style={{ margin: "0 auto" }}>
          <path
            d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
            fill="#2563eb"
          />
          <circle cx="12" cy="9" r="2.5" fill="white" />
        </svg>

        <h1 style={{ color: "white", fontSize: 32, margin: "12px 0 4px", letterSpacing: 0.3 }}>
          Last Seen
        </h1>
        <p style={{ color: "#94a3b8", marginBottom: 36, fontSize: 15 }}>
          Real-time crowd alerts for missing persons.
        </p>

        <button
          onClick={() => navigate("/report")}
          style={{
            display: "block",
            width: "100%",
            padding: "16px",
            fontSize: 16,
            fontWeight: 600,
            borderRadius: 12,
            border: "none",
            cursor: "pointer",
            backgroundColor: "#2563eb",
            color: "white",
            boxShadow: "0 4px 14px rgba(37, 99, 235, 0.35)",
          }}
        >
          Report a Missing Person
        </button>

        <button
          onClick={() => navigate("/portal")}
          style={{
            display: "block",
            width: "100%",
            padding: "16px",
            fontSize: 16,
            fontWeight: 600,
            borderRadius: 12,
            border: "1px solid #334155",
            cursor: "pointer",
            backgroundColor: "transparent",
            color: "#cbd5e1",
            marginTop: 14,
          }}
        >
          Police / Admin Login
        </button>
      </div>
    </div>
  );
}

export default Home;