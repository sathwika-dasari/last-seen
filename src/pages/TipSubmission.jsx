import { useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { supabase } from "../supabase";

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

function TipSubmission() {
  const { caseId } = useParams();

  const [pin, setPin] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];

      recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setRecording(true);

      timerRef.current = setTimeout(() => {
        recorder.stop();
        setRecording(false);
      }, 10000);
    } catch (err) {
      alert("Microphone access denied or unavailable.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
      clearTimeout(timerRef.current);
    }
  };

  const handleSubmit = async () => {
    if (!pin) {
      alert("Please drop a pin where you saw them.");
      return;
    }
    setSubmitting(true);

    try {
      let voiceNoteURL = null;

      if (audioBlob) {
        const fileName = `tip_${Date.now()}.webm`;
        const { error: uploadError } = await supabase.storage
          .from("photos")
          .upload(`voice-notes/${fileName}`, audioBlob);
        if (!uploadError) {
          const { data: urlData } = supabase.storage
            .from("photos")
            .getPublicUrl(`voice-notes/${fileName}`);
          voiceNoteURL = urlData.publicUrl;
        }
      }

      const { error: insertError } = await supabase.from("tips").insert([
        {
          case_id: caseId,
          lat: pin.lat,
          lng: pin.lng,
          voice_note_url: voiceNoteURL,
        },
      ]);
      if (insertError) throw insertError;

      setSubmitted(true);
    } catch (err) {
      console.error(err);
      alert("Something went wrong: " + err.message);
    }
    setSubmitting(false);
  };

  if (submitted) {
    return (
      <div style={{ maxWidth: 500, margin: "0 auto", padding: 40, textAlign: "center" }}>
        <h2>Thank you</h2>
        <p style={{ color: "#666", fontSize: 16 }}>
          Your tip has been submitted anonymously and shared with the family and authorities.
        </p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 500, margin: "0 auto", padding: 20 }}>
      <h2>Where did you see them?</h2>
      <p style={{ color: "#666" }}>This tip is submitted anonymously.</p>

      <label>1. Tap on map to drop a pin</label>
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
        2. Optional: 10-second voice note
      </label>
      <div style={{ marginTop: 8 }}>
        {!recording && !audioBlob && (
          <button onClick={startRecording} style={{ padding: "8px 16px" }}>
            🎙️ Start Recording
          </button>
        )}
        {recording && (
          <button onClick={stopRecording} style={{ padding: "8px 16px", color: "red" }}>
            ⏹ Stop Recording
          </button>
        )}
        {audioBlob && !recording && (
          <div>
            <audio controls src={URL.createObjectURL(audioBlob)} />
            <button onClick={() => setAudioBlob(null)} style={{ marginLeft: 8 }}>
              Re-record
            </button>
          </div>
        )}
      </div>

      <button
        style={{ marginTop: 24, padding: "12px 24px", fontSize: 16, width: "100%" }}
        onClick={handleSubmit}
        disabled={submitting}
      >
        {submitting ? "Submitting..." : "Submit Tip Anonymously"}
      </button>
    </div>
  );
}

export default TipSubmission;