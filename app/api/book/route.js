import { google } from 'googleapis';
import { NextResponse } from 'next/server';
import { DateTime } from 'luxon';

// Owner's timezone - all calendar events are created in this timezone
const OWNER_TIMEZONE = 'Europe/London';

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, email, notes, guests = [], startTime, endTime, userTimezone } = body;

    // Convert user's selected time to owner's timezone for the calendar event
    let eventStartTime = startTime;
    let eventEndTime = endTime;

    if (userTimezone && userTimezone !== OWNER_TIMEZONE) {
      try {
        // Parse the time in user's timezone and convert to owner's timezone
        eventStartTime = DateTime.fromISO(startTime, { zone: userTimezone })
          .setZone(OWNER_TIMEZONE)
          .toISO();
        eventEndTime = DateTime.fromISO(endTime, { zone: userTimezone })
          .setZone(OWNER_TIMEZONE)
          .toISO();
      } catch (error) {
        console.error('Timezone conversion error:', error);
        // Fall back to original times if conversion fails
      }
    }

    // Use Domain-Wide Delegation to impersonate the calendar owner
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/calendar'],
      clientOptions: {
        subject: process.env.GOOGLE_CALENDAR_ID,
      },
    });

    const calendar = google.calendar({ version: 'v3', auth });

    // Build attendees list
    const attendees = [
      { email },
      ...guests.map((g) => ({ email: g }))
    ];

    await calendar.events.insert({
      calendarId: 'primary',
      sendUpdates: 'all',
      conferenceDataVersion: 1,
      requestBody: {
        summary: `MindsetOS: Jake & ${name}`,
        description: `Notes: ${notes || 'None'}`,
        start: { dateTime: eventStartTime, timeZone: OWNER_TIMEZONE },
        end: { dateTime: eventEndTime, timeZone: OWNER_TIMEZONE },
        attendees,
        colorId: '11', // Tomato (red)
        conferenceData: {
          createRequest: {
            requestId: `mindset-${Date.now()}`,
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
