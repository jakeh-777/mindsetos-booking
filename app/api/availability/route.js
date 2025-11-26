import { google } from "googleapis";
import { getToken } from "next-auth/jwt";

export async function GET(req) {
  try {
    const token = await getToken({ req });

    if (!token?.accessToken) {
      return new Response(
        JSON.stringify({ error: "Not authenticated" }),
        { status: 401 }
      );
    }

    const url = new URL(req.url);
    const date = url.searchParams.get("date");

    if (!date) {
      return new Response(
        JSON.stringify({ error: "Missing date parameter" }),
        { status: 400 }
      );
    }

    const oauth2 = new google.auth.OAuth2();
    oauth2.setCredentials({
      access_token: token.accessToken,
    });

    const calendar = google.calendar({ version: "v3", auth: oauth2 });

    const response = await calendar.freebusy.query({
      requestBody: {
        timeMin: `${date}T00:00:00Z`,
        timeMax: `${date}T23:59:59Z`,
        items: [{ id: "primary" }],
      },
    });

    const busy =
      response.data.calendars?.primary?.busy || [];

    return Response.json(busy);

  } catch (error) {
    console.error("Availability error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch availability" }),
      { status: 500 }
    );
  }
}

