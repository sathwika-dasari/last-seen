import { useEffect, useState } from "react";
import { supabase } from "../supabase";
import { triggerAlert } from "../alerts";

function AdminApproval() {
  const [pendingCases, setPendingCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [approvingId, setApprovingId] = useState(null);

  useEffect(() => {
    fetchPending();
  }, []);

  async function fetchPending() {
    setLoading(true);
    const { data, error } = await supabase
      .from("cases")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: false });
    if (!error && data) setPendingCases(data);
    setLoading(false);
  }

  const handleApprove = async (c) => {
    setApprovingId(c.id);
    try {
      const result = await triggerAlert(
        c.id,
        { lat: c.lat, lng: c.lng },
        c.photo_url,
        3
      );

      await supabase
        .from("cases")
        .update({
          status: "active",
          alerted_count: result?.alertedCount || 0,
          radius: 3000,
        })
        .eq("id", c.id);

      setPendingCases((prev) => prev.filter((p) => p.id !== c.id));
    } catch (err) {
      console.error(err);
      alert("Something went wrong approving this case.");
    }
    setApprovingId(null);
  };

  const handleReject = async (c) => {
    try {
      await supabase.from("cases").update({ status: "rejected" }).eq("id", c.id);
      setPendingCases((prev) => prev.filter((p) => p.id !== c.id));
    } catch (err) {
      console.error(err);
      alert("Something went wrong rejecting this case.");
    }
  };

  if (loading) return <p style={{ padding: 20 }}>Loading pending reports...</p>;

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: 20 }}>
      <h2>Pending Reports — Admin Review</h2>
      <p style={{ color: "#666" }}>
        Reports appear here before any alerts go out. Approve only verified cases.
      </p>

      {pendingCases.length === 0 && (
        <p style={{ color: "#666", marginTop: 20 }}>No pending reports right now.</p>
      )}

      {pendingCases.map((c) => (
        <div
          key={c.id}
          style={{
            border: "1px solid #ddd",
            borderRadius: 8,
            padding: 16,
            marginTop: 12,
            display: "flex",
            gap: 16,
          }}
        >
          <img
            src={c.photo_url}
            alt="Reported missing person"
            style={{ width: 100, height: 100, objectFit: "cover", borderRadius: 8 }}
          />
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0 }}>
              <strong>Last seen:</strong>{" "}
              {new Date(c.last_seen_time).toLocaleString()}
            </p>
            <p style={{ margin: "4px 0", color: "#666" }}>
              📍 {c.lat.toFixed(4)}, {c.lng.toFixed(4)}
            </p>
            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <button
                onClick={() => handleApprove(c)}
                disabled={approvingId === c.id}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#16a34a",
                  color: "white",
                  border: "none",
                  borderRadius: 6,
                }}
              >
                {approvingId === c.id ? "Activating..." : "Approve & Activate"}
              </button>
              <button
                onClick={() => handleReject(c)}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#e5e7eb",
                  border: "none",
                  borderRadius: 6,
                }}
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default AdminApproval;