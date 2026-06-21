import "dotenv/config";
import express from "express";
import cors from "cors";
import twilio from "twilio";
import { createClient } from "@supabase/supabase-js";

const app = express();
app.use(cors());
app.use(express.json());

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

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

app.post("/send-sms", async (req, res) => {
  const { alertURL, lat, lng, radiusKm } = req.body;
  const radius = radiusKm || 3;

  try {
    const { data: subscribers, error } = await supabase
      .from("subscribers")
      .select("*");

    if (error) throw error;

    const inRange = subscribers.filter((sub) => {
      const distance = getDistanceKm(lat, lng, sub.lat, sub.lng);
      return distance <= radius;
    });

    console.log(`Found ${inRange.length} subscriber(s) within ${radius}km`);

    const results = [];
    for (const sub of inRange) {
      try {
        const message = await client.messages.create({
          body: `Missing Person Alert near you. Tap to view: ${alertURL}`,
          from: TWILIO_PHONE_NUMBER,
          to: sub.phone,
        });
        console.log(`SMS sent to ${sub.phone}: ${message.sid}`);
        results.push({ phone: sub.phone, success: true });
      } catch (smsErr) {
        console.error(`Failed to text ${sub.phone}:`, smsErr.message);
        results.push({ phone: sub.phone, success: false, error: smsErr.message });
      }
    }

    res.json({ success: true, alertedCount: inRange.length, results });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(3001, () => {
  console.log("SMS server running on http://localhost:3001");
});