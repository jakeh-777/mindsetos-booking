import { google } from 'googleapis';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();

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
    const guests = body.guests || [];

    // Build attendees list
    const attendees = [
      { email: body.email },
      ...guests.map((g) => ({ email: g }))
    ];

    await calendar.events.insert({
      calendarId: 'primary',
      sendUpdates: 'all',
      conferenceDataVersion: 1, // Enable Google Meet creation
      requestBody: {
        summary: `MindsetOS & ${body.name}`,
        description: `Notes: ${body.notes || 'None'}`,
        start: { dateTime: body.startTime, timeZone: 'Europe/London' },
        end: { dateTime: body.endTime, timeZone: 'Europe/London' },
        attendees,
        colorId: '11', // Tomato (red)
        conferenceData: {
          createRequest: {
            requestId: `mindset-${Date.now()}`, // Unique ID for each meeting
            conferenceSolutionKey: { type: 'hangoutsMeet' },
          },
        },
      },
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Booking Error:', error);
    return NextResponse.json({ error: 'Booking failed', details: error?.message }, { status: 500 });
  }
}
