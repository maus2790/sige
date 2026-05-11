export async function sendOneSignalNotification({
  userIds,
  title,
  message,
  url
}: {
  userIds: string[];
  title: string;
  message: string;
  url?: string;
}) {
  const ONESIGNAL_APP_ID = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
  const ONESIGNAL_REST_API_KEY = process.env.ONESIGNAL_API_KEY;

  if (!ONESIGNAL_APP_ID || !ONESIGNAL_REST_API_KEY) {
    console.error("Missing OneSignal credentials");
    return { success: false, error: "Missing credentials" };
  }

  if (!userIds || userIds.length === 0) {
    return { success: false, error: "No target users" };
  }

  // Ensure absolute URL
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://sige.click";
  let finalUrl = url || baseUrl;
  if (finalUrl.startsWith('/')) {
    finalUrl = `${baseUrl}${finalUrl}`;
  }

  const payload = {
    app_id: ONESIGNAL_APP_ID,
    // Using include_external_user_ids for better compatibility with v1 API
    include_external_user_ids: userIds,
    target_channel: "push",
    headings: { en: title, es: title },
    contents: { en: message, es: message },
    url: finalUrl,
    // Add some visual enhancements
    chrome_web_icon: `${baseUrl}/icons/icon-192.png`,
    android_accent_color: "FF0000FF", // SIGE Blue
  };

  try {
    console.log("Sending OneSignal notification to:", userIds);
    const response = await fetch("https://onesignal.com/api/v1/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        Authorization: `Basic ${ONESIGNAL_REST_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log("OneSignal notification sent successfully:", data);
      return { success: true, data };
    } else {
      console.error("OneSignal API error details:", JSON.stringify(data, null, 2));
      return { success: false, error: data };
    }
  } catch (error) {
    console.error("Error sending OneSignal notification:", error);
    return { success: false, error };
  }
}
