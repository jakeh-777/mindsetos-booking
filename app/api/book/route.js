import { google } from 'googleapis';
import { NextResponse } from 'next/server';
import { DateTime } from 'luxon';
import { Client } from '@notionhq/client';

// Owner's timezone - all calendar events are created in this timezone
const OWNER_TIMEZONE = 'Europe/London';

// Initialize Notion client
const notion = new Client({ auth: process.env.NOTION_TOKEN });
const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID;

// Sync contact to Notion CRM
async function syncToNotion(bookingData) {
  try {
    const { name, email, notes, startTime } = bookingData;
    
    // Check if contact already exists by email
    const existingContacts = await notion.databases.query({
      database_id: NOTION_DATABASE_ID,
      filter: {
        property: 'Email',
        email: {
          equals: email,
        },
      },
    });

    const meetingDate = DateTime.fromISO(startTime).toISODate();
    const meetingNote = `MindsetOS booking on ${meetingDate}. Notes: ${notes || 'None'}`;

    if (existingContacts.results.length > 0) {
      // Update existing contact - append to Personal Notes
      const existingContact = existingContacts.results[0];
      const currentNotes = existingContact.properties['Personal Notes']?.rich_text?.[0]?.plain_text || '';
      const updatedNotes = currentNotes ? `${currentNotes}\n\n---\n${meetingNote}` : meetingNote;

      await notion.pages.update({
        page_id: existingContact.id,
        properties: {
          'Personal Notes': {
            rich_text: [{ text: { content: updatedNotes.slice(0, 2000) } }], // Notion limit
          },
        },
      });
      console.log('Updated existing Notion contact:', email);
    } else {
      // Create new contact
      await notion.pages.create({
        parent: { database_id: NOTION_DATABASE_ID },
        properties: {
          'Contact Name': {
            title: [{ text: { content: name } }],
          },
          'Email': {
            email: email,
          },
          'Personal Notes': {
            rich_text: [{ text: { content: meetingNote } }],
          },
          'Pilot Start Date': {
            date: { start: meetingDate },
          },
        },
      });
      console.log('Created new Notion contact:', email);
    }
  } catch (error) {
    console.error('Notion sync error:', error);
    // Don't throw - we don't want Notion errors to break the booking
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, email, notes, guests = [], startTime, endTime, userTimezone } = body;

    // Convert user's selected time to owner's timezone for the calendar event
    let eventStartTime = startTime;
    let eventEndTime = endTime;

    if (userTimezone && userTimezone !== OWNER_TIMEZONE) {
      try {
        eventStartTime = DateTime.fromISO(startTime, { zone: userTimezone })
          .setZone(OWNER_TIMEZONE)
          .toISO();
        eventEndTime = DateTime.fromISO(endTime, { zone: userTimezone })
          .setZone(OWNER_TIMEZONE)
          .toISO();
      } catch (error) {
        console.error('Timezone conversion error:', error);
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

    // Create Google Calendar event
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
        colorId: '11',
        conferenceData: {
          createRequest: {
            requestId: `mindset-${Date.now()}`,
            conferenceSolutionKey: { type: 'hangoutsMeet' },
          },
        },
      },
    });

    // Sync to Notion CRM (non-blocking)
    syncToNotion({ name, email, notes, startTime: eventStartTime });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Booking Error:', error);
    return NextResponse.json({ error: 'Booking failed', details: error?.message }, { status: 500 });
  }
}
