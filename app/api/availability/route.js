import { google } from 'googleapis';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Use Domain-Wide Delegation to impersonate the calendar owner
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/calendar'],
      clientOptions: {
        subject: process.env.GOOGLE_CALENDAR_ID, // Impersonate this user
      },
    });

    const calendar = google.calendar({ version: 'v3', auth });

    const response = await calendar.freebusy.query({
      requestBody: {
        timeMin: new Date().toISOString(),
        timeMax: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        items: [{ id: 'primary' }],
      },
    });

    const calendarData = response.data.calendars?.['primary'];
    const busySlots = calendarData?.busy || [];

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
