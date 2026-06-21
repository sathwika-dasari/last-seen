import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { supabase } from "../supabase";
import Header from "../components/Header";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const defaultCenter = [17.385, 78.4867];

function LocationPicker({ onPick }) {
  useMapEvents({
    click(e) {
      onPick({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

function ReportPage() {
  const navigate = useNavigate();

  const [photo, setPhoto] = useState(null);
  const [pin, setPin] = useState(null);
  const [lastSeenTime, setLastSeenTime] = useState("");
  const [uploading, setUploading] = useState(false);

  const handleSubmit = async () => {
    if (!photo || !pin || !lastSeenTime) {
      alert("Please add a photo, drop a pin, and set last seen time.");
      return;
    }
    setUploading(true);

    try {
      const fileName = `${Date.now()}_${photo.name}`;
      const { error: uploadError } = await supabase.storage
        .from("photos")
        .upload(fileName, photo);
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("photos")
        .getPublicUrl(fileName);
      const photoURL = urlData.publicUrl;

      const { data: caseData, error: insertError } = await supabase
        .from("cases")
        .insert([
          {
            photo_url: photoURL,
            lat: pin.lat,
            lng: pin.lng,
            last_seen_time: lastSeenTime,
            status: "pending",
            radius: 3000,
            alerted_count: 0,
          },
        ])
        .select()
        .single();
      if (insertError) throw insertError;

      navigate(`/dashboard/${caseData.id}`);
    } catch (err) {
      console.error(err);
      alert("Something went wrong: " + err.message);
    }
    setUploading(false);
  };

  return (
    <div style={{ maxWidth: 500, margin: "0 auto", padding: 20 }}>
      <Header />
      <h2>Report Missing Person</h2>
      <p style={{ color: "#666" }}>
        Your report will be reviewed before alerts are sent out.
      </p>

      <label>1. Upload photo</label>
      <input
        type="file"
        accept="image/*"
        onChange={(e) => setPhoto(e.target.files[0])}
      />

      <label style={{ display: "block", marginTop: 16 }}>
        2. Tap on map to drop last-seen pin
      </label>
      <MapContainer
        center={defaultCenter}
        zoom={13}
        style={{ height: "300px", width: "100%" }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap contributors'
        />
        <LocationPicker onPick={setPin} />
        {pin && <Marker position={[pin.lat, pin.lng]} />}
      </MapContainer>

      <label style={{ display: "block", marginTop: 16 }}>
        3. Last seen time
      </label>
      <input
        type="datetime-local"
        value={lastSeenTime}
        onChange={(e) => setLastSeenTime(e.target.value)}
      />

      <button
        style={{ marginTop: 20, padding: "12px 24px", fontSize: 16 }}
        onClick={handleSubmit}
        disabled={uploading}
      >
        {uploading ? "Submitting..." : "Submit Report"}
      </button>
    </div>
  );
}

export default ReportPage;