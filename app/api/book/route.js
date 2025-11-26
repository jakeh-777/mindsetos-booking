import { google } from "googleapis";
import { getToken } from "next-auth/jwt";

export async function POST(req) {
  try {
    const token = await getToken({ req });

    if (!token?.accessToken) {
      return new Response(
        JSON.stringify({ error: "Not authenticated" }),
        { status: 401 }
      );
    }

    const body = await req.json();
    const { name, email, notes, startTime, endTime, guests = [] } = body;

    // OAuth2 client
    const oauth2 = new google.auth.OAuth2();
    oauth2.setCredentials({
      access_token: token.accessToken,
    });

    const calendar = google.calendar({ version: "v3", auth: oauth2 });

    // Build attendees list
    const attendees = [
      { email }, // client
      ...guests.map((g) => ({ email: g })), // extra guests
    ];

    // Create event
    const event = await calendar.events.insert({
      calendarId: "primary",
      sendUpdates: "all", // sends email notifications
      requestBody: {
        summary: `Session with ${name}`,
        description: notes || "No notes provided.",
        start: { dateTime: startTime },
        end: { dateTime: endTime },
        attendees,
      },
    });

    return Response.json({
      success: true,
      event: event.data,
    });
  } catch (error) {
    console.error("Booking Error:", error);
    return new Response(JSON.stringify({ error: "Booking failed" }), {
      status: 500,
    });
  }
}

