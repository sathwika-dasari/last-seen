import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../supabase";

function getDistanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function timeAgo(timestamp) {
  const diffMs = Date.now() - new Date(timestamp).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  return `${hrs} hr ago`;
}

function AlertCard() {
  const { caseId } = useParams();
  const navigate = useNavigate();
  const [caseData, setCaseData] = useState(null);
  const [distance, setDistance] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCase() {
      const { data, error } = await supabase
        .from("cases")
        .select("*")
        .eq("id", caseId)
        .single();
      if (!error) setCaseData(data);
      setLoading(false);
    }
    fetchCase();
  }, [caseId]);

  useEffect(() => {
    if (caseData && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const d = getDistanceKm(
            pos.coords.latitude,
            pos.coords.longitude,
            caseData.lat,
            caseData.lng
          );
          setDistance(d);
        },
        () => setDistance(null)
      );
    }
  }, [caseData]);

  if (loading) return <p style={{ padding: 20 }}>Loading...</p>;
  if (!caseData) return <p style={{ padding: 20 }}>Case not found.</p>;

  return (
    <div style={{ maxWidth: 420, margin: "0 auto", padding: 20, textAlign: "center" }}>
      <img
        src={caseData.photo_url}
        alt="Missing person"
        style={{ width: "100%", borderRadius: 12, maxHeight: 350, objectFit: "cover" }}
      />
      <h2 style={{ marginTop: 16 }}>Missing Person Alert</h2>
      <p style={{ fontSize: 18 }}>
        Last seen {distance !== null ? `${distance.toFixed(1)} km` : "nearby"} from
        you, {timeAgo(caseData.last_seen_time)}
      </p>

      <button
        style={{
          width: "100%",
          padding: 14,
          fontSize: 16,
          marginTop: 16,
          backgroundColor: "#2563eb",
          color: "white",
          border: "none",
          borderRadius: 8,
        }}
        onClick={() => navigate(`/tip/${caseId}`)}
      >
        I think I saw this person
      </button>

      <button
        style={{
          width: "100%",
          padding: 14,
          fontSize: 16,
          marginTop: 10,
          backgroundColor: "#e5e7eb",
          border: "none",
          borderRadius: 8,
        }}
        onClick={() => navigate("/")}
      >
        I haven't seen them
      </button>
    </div>
  );
}

export default AlertCard;