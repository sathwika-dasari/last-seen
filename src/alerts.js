export async function triggerAlert(caseId, pin, photoURL, radiusKm = 3) {
  const alertURL = `${window.location.origin}/alert/${caseId}`;

  try {
    const response = await fetch("http://localhost:3001/send-sms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        alertURL,
        lat: pin.lat,
        lng: pin.lng,
        radiusKm,
      }),
    });
    const data = await response.json();
    console.log("Alert result:", data);
    return data;
  } catch (err) {
    console.warn("Alert not sent:", err);
    return { success: false, alertedCount: 0 };
  }
}