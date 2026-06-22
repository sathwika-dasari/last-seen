import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Circle } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { supabase } from "../supabase";
import { triggerAlert } from "../alerts";
import Header from "../components/Header";

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

function FamilyDashboard() {
  const { caseId } = useParams();
  const [caseData, setCaseData] = useState(null);
  const [tips, setTips] = useState([]);
  const [radius, setRadius] = useState(3000);
  const [alertedCount, setAlertedCount] = useState(0);
  const [expanding, setExpanding] = useState(false);

  useEffect(() => {
    async function fetchData() {
      const { data: c } = await supabase
        .from("cases")
        .select("*")
        .eq("id", caseId)
        .single();
      if (c) {
        setCaseData(c);
        setRadius(c.radius || 3000);
        setAlertedCount(c.alerted_count || 0);
      }

      const { data: t } = await supabase
        .from("tips")
        .select("*")
        .eq("case_id", caseId)
        .order("created_at", { ascending: false });
      if (t) setTips(t);
    }
    fetchData();
  }, [caseId]);

  useEffect(() => {
    const channel = supabase
      .channel(`realtime-${caseId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "tips",
          filter: `case_id=eq.${caseId}`,
        },
        (payload) => {
          setTips((prev) => [payload.new, ...prev]);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "cases",
          filter: `id=eq.${caseId}`,
        },
        (payload) => {
          setCaseData(payload.new);
          setRadius(payload.new.radius || 3000);
          setAlertedCount(payload.new.alerted_count || 0);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [caseId]);

  const handleExpandRadius = async () => {
    if (!caseData) return;
    setExpanding(true);

    const newRadiusMeters = radius + 3000;
    const newRadiusKm = newRadiusMeters / 1000;

    try {
      const result = await triggerAlert(
        caseId,
        { lat: caseData.lat, lng: caseData.lng },
        caseData.photo_url,
        newRadiusKm
      );

      if (result && result.success) {
        setRadius(newRadiusMeters);
        setAlertedCount(result.alertedCount);

        await supabase
          .from("cases")
          .update({ radius: newRadiusMeters, alerted_count: result.alertedCount })
          .eq("id", caseId);
      } else {
        alert("Could not expand search — check that the backend server is running.");
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong expanding the search.");
    }
    setExpanding(false);
  };

  const copyTip = async (tip) => {
    try {
      await supabase
        .from("tips")
        .update({ shared_with_police: true })
        .eq("id", tip.id);

      setTips((prev) =>
        prev.map((t) => (t.id === tip.id ? { ...t, shared_with_police: true } : t))
      );

      alert("This tip is now visible on the Police Dashboard.");
    } catch (err) {
      console.error(err);
      alert("Something went wrong sharing this tip.");
    }
  };

  if (!caseData) return <p style={{ padding: 20 }}>Loading case...</p>;

  return (
    <div style={{ maxWidth: 700, margin: "0 auto", padding: 20 }}>
      <Header />
      <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
        <img
          src={caseData.photo_url}
          alt="Missing person"
          style={{ width: 100, height: 100, objectFit: "cover", borderRadius: 8 }}
        />
        <div>
          <h2 style={{ margin: 0 }}>Search Dashboard</h2>
          <p style={{ margin: 0, color: "#666" }}>
            Status: <strong>{caseData.status}</strong>
          </p>
        </div>
      </div>

      <div style={{ display: "flex", gap: 24, marginTop: 16 }}>
        <div>
          <div style={{ fontSize: 28, fontWeight: "bold" }}>{alertedCount}</div>
          <div style={{ color: "#666" }}>People alerted</div>
        </div>
        <div>
          <div style={{ fontSize: 28, fontWeight: "bold" }}>{tips.length}</div>
          <div style={{ color: "#666" }}>Tips received</div>
        </div>
        <div>
          <div style={{ fontSize: 28, fontWeight: "bold" }}>
            {(radius / 1000).toFixed(1)} km
          </div>
          <div style={{ color: "#666" }}>Search radius</div>
        </div>
      </div>

      <button
        onClick={handleExpandRadius}
        disabled={expanding}
        style={{
          marginTop: 16,
          padding: "10px 18px",
          fontSize: 15,
          backgroundColor: "#dc2626",
          color: "white",
          border: "none",
          borderRadius: 8,
        }}
      >
        {expanding ? "Expanding..." : "Expand Search Radius (+3km)"}
      </button>

      <MapContainer
        center={[caseData.lat, caseData.lng]}
        zoom={13}
        style={{ height: "350px", width: "100%", marginTop: 16 }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap contributors'
        />
        <Marker position={[caseData.lat, caseData.lng]} />
        <Circle
          center={[caseData.lat, caseData.lng]}
          radius={radius}
          pathOptions={{ color: "#2563eb", fillOpacity: 0.08 }}
        />
        {tips.map((tip) => (
          <Marker key={tip.id} position={[tip.lat, tip.lng]} icon={tipIcon} />
        ))}
      </MapContainer>

      <h3 style={{ marginTop: 24 }}>Tips ({tips.length})</h3>
      {tips.length === 0 && <p style={{ color: "#666" }}>No tips yet.</p>}
      {tips.map((tip) => (
        <div
          key={tip.id}
          style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12, marginTop: 8 }}
        >
          <p style={{ margin: 0 }}>
            📍 {tip.lat.toFixed(4)}, {tip.lng.toFixed(4)}
            {tip.time_seen && (
              <span style={{ color: "#dc2626", fontWeight: 600 }}> — seen {tip.time_seen}</span>
            )}
          </p>
          <p style={{ margin: 0, color: "#666", fontSize: 14 }}>
            {new Date(tip.created_at).toLocaleString()}
          </p>
          {tip.voice_note_url && (
            <audio controls src={tip.voice_note_url} style={{ marginTop: 8 }} />
          )}
          {tip.shared_with_police ? (
            <span
              style={{
                marginTop: 8,
                display: "inline-block",
                padding: "6px 12px",
                backgroundColor: "#dcfce7",
                color: "#166534",
                borderRadius: 6,
                fontSize: 14,
              }}
            >
              ✓ Shared with Police
            </span>
          ) : (
            <button onClick={() => copyTip(tip)} style={{ marginTop: 8, padding: "6px 12px" }}>
              Share with Police
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

export default FamilyDashboard;