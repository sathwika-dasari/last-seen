import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { supabase } from "../supabase";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const tipIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function PoliceDashboard() {
  const [groupedCases, setGroupedCases] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSharedTips();

    const channel = supabase
      .channel("police-shared-tips")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tips" },
        () => fetchSharedTips()
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  async function fetchSharedTips() {
    const { data: tipsData, error: tipsError } = await supabase
      .from("tips")
      .select("*")
      .eq("shared_with_police", true)
      .order("created_at", { ascending: false });

    if (tipsError || !tipsData || tipsData.length === 0) {
      setGroupedCases([]);
      setLoading(false);
      return;
    }

    const caseIds = [...new Set(tipsData.map((t) => t.case_id))];
    const { data: casesData } = await supabase
      .from("cases")
      .select("*")
      .in("id", caseIds);

    const casesMap = {};
    (casesData || []).forEach((c) => {
      casesMap[c.id] = c;
    });

    const groups = caseIds
      .map((id) => ({
        case: casesMap[id],
        tips: tipsData.filter((t) => t.case_id === id),
      }))
      .filter((g) => g.case);

    setGroupedCases(groups);
    setLoading(false);
  }

  if (loading) return <p style={{ padding: 20 }}>Loading shared tips...</p>;

  if (groupedCases.length === 0) {
    return (
      <div>
        <h2>Police Dashboard</h2>
        <p style={{ color: "#666" }}>No tips have been shared yet.</p>
      </div>
    );
  }

  return (
    <div>
      <h2>Police Dashboard</h2>
      <p style={{ color: "#666", marginBottom: 24 }}>
        Tips shared by families, grouped by case.
      </p>

      {groupedCases.map(({ case: c, tips }) => (
        <div
          key={c.id}
          style={{
            border: "1px solid #334155",
            borderRadius: 12,
            padding: 16,
            marginBottom: 24,
          }}
        >
          <div style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 12 }}>
            <img
              src={c.photo_url}
              alt="Missing person"
              style={{ width: 64, height: 64, objectFit: "cover", borderRadius: 8 }}
            />
            <div>
              <h3 style={{ margin: 0 }}>Case #{c.id}</h3>
              <p style={{ margin: 0, color: "#666", fontSize: 14 }}>
                Status: <strong>{c.status}</strong> · {tips.length} tip{tips.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>

          <MapContainer
            center={[c.lat, c.lng]}
            zoom={13}
            style={{ height: 280, width: "100%", borderRadius: 8 }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; OpenStreetMap contributors'
            />
            <Marker position={[c.lat, c.lng]}>
              <Popup>
                <strong>Case #{c.id}</strong>
                <br />
                Last seen location
              </Popup>
            </Marker>
            {tips.map((tip) => (
              <Marker key={tip.id} position={[tip.lat, tip.lng]} icon={tipIcon}>
                <Popup>
                  <strong>Case #{c.id}</strong>
                  <br />
                  Seen {tip.time_seen || "recently"}
                  <br />
                  {new Date(tip.created_at).toLocaleString()}
                </Popup>
              </Marker>
            ))}
          </MapContainer>

          <div style={{ marginTop: 12 }}>
            {tips.map((tip) => (
              <div
                key={tip.id}
                style={{
                  fontSize: 14,
                  color: "#cbd5e1",
                  padding: "8px 0",
                  borderTop: "1px solid #1e293b",
                }}
              >
                📍 {tip.lat.toFixed(4)}, {tip.lng.toFixed(4)}
                {tip.time_seen && (
                  <span style={{ color: "#f87171", fontWeight: 600 }}> — seen {tip.time_seen}</span>
                )}
                {tip.voice_note_url && (
                  <audio
                    controls
                    src={tip.voice_note_url}
                    style={{ display: "block", marginTop: 6 }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default PoliceDashboard;