import { google } from 'googleapis';
import { NextResponse } from 'next/server';
import { DateTime } from 'luxon';

// Owner's timezone - all calendar events are stored in this timezone
const OWNER_TIMEZONE = 'Europe/London';

export async function GET(request) {
  try {
    // Get user's timezone from query param
    const { searchParams } = new URL(request.url);
    const userTimezone = searchParams.get('tz') || 'UTC';

    // Validate timezone
    let validTimezone = userTimezone;
    try {
      DateTime.now().setZone(userTimezone);
    } catch {
      console.warn(`Invalid timezone: ${userTimezone}, defaulting to UTC`);
      validTimezone = 'UTC';
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

    // Fetch free/busy for next 30 days
    const response = await calendar.freebusy.query({
      requestBody: {
        timeMin: new Date().toISOString(),
        timeMax: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        timeZone: OWNER_TIMEZONE,
        items: [{ id: 'primary' }],
      },
    });

    const calendarData = response.data.calendars?.['primary'];
    const busySlots = calendarData?.busy || [];

    // Convert busy slots from owner timezone to user timezone
    const convertedSlots = busySlots.map(slot => {
      try {
        const startInUserTz = DateTime.fromISO(slot.start, { zone: 'UTC' })
          .setZone(validTimezone)
          .toISO();
        const endInUserTz = DateTime.fromISO(slot.end, { zone: 'UTC' })
          .setZone(validTimezone)
          .toISO();
        
        return {
          start: startInUserTz,
          end: endInUserTz,
        };
      } catch (error) {
        console.error('Timezone conversion error:', error);
        return slot; // Return original if conversion fails
      }
    });

    return NextResponse.json({
      slots: convertedSlots,
      timezone: validTimezone,
      ownerTimezone: OWNER_TIMEZONE,
    });
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
