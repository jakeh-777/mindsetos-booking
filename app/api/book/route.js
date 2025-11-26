import { google } from 'googleapis';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/calendar'],
    });

    const calendar = google.calendar({ version: 'v3', auth });

    await calendar.events.insert({
      calendarId: 'jake@themindsetos.com',
      requestBody: {
        summary: `Booking: ${body.name}`,
        description: `Notes: ${body.notes}\nGuests: ${body.guests.join(', ')}`,
        start: { dateTime: body.startTime },
        end: { dateTime: body.endTime },
        attendees: [
          { email: body.email },
          { email: 'jake@themindsetos.com' },
          ...body.guests.map((g) => ({ email: g }))
        ],
      },
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Booking Error:', error);
    return NextResponse.json({ error: 'Booking failed' }, { status: 500 });
  }
}
