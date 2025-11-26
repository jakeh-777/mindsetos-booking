import { google } from 'googleapis';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log("ENV CHECK:", process.env.GOOGLE_CLIENT_EMAIL);

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/calendar'],
    });

    const calendar = google.calendar({ version: 'v3', auth });

    const response = await calendar.freebusy.query({
      requestBody: {
        timeMin: new Date().toISOString(),
        timeMax: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        items: [{ id: 'jake@themindsetos.com' }],
      },
    });

    const busySlots =
      response.data.calendars['jake@themindsetos.com'].busy || [];

    return NextResponse.json(busySlots);
  } catch (error) {
    console.error('Google Calendar Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch calendar',
        details: error?.message,
      },
      { status: 500 }
    );
  }
}
