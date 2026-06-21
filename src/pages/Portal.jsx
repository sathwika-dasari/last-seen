import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminApproval from "./AdminApproval";
import PoliceDashboard from "./PoliceDashboard";
import Header from "../components/Header";

function Portal() {
  const [activeTab, setActiveTab] = useState("reports");
  const navigate = useNavigate();

  const tabStyle = (tab) => ({
    padding: "10px 20px",
    fontSize: 15,
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
    backgroundColor: activeTab === tab ? "#2563eb" : "#1e293b",
    color: activeTab === tab ? "white" : "#cbd5e1",
    fontWeight: 600,
  });

  const handleLogout = () => {
    sessionStorage.removeItem("lastSeenAuth");
    navigate("/");
  };

  return (
    <div style={{ maxWidth: 700, margin: "0 auto", padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Header />
        <button
          onClick={handleLogout}
          style={{
            padding: "8px 16px",
            fontSize: 14,
            borderRadius: 8,
            border: "1px solid #334155",
            backgroundColor: "transparent",
            color: "#cbd5e1",
            cursor: "pointer",
            height: "fit-content",
          }}
        >
          Log Out
        </button>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
        <button style={tabStyle("reports")} onClick={() => setActiveTab("reports")}>
          Pending Reports
        </button>
        <button style={tabStyle("tips")} onClick={() => setActiveTab("tips")}>
          Tips Dashboard
        </button>
      </div>

      {activeTab === "reports" ? <AdminApproval /> : <PoliceDashboard />}
    </div>
  );
}

export default Portal;