"use client";

import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, ChevronRight, Clock, Calendar as CalendarIcon, 
  Video, User, Mail, ArrowRight, ShieldCheck, CheckCircle2, Users, Plus, X, Globe
} from 'lucide-react';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const START_HOUR = 9;
const END_HOUR = 16;

const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

const formatDateId = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return year + '-' + month + '-' + day;
};

const generateTimeSlots = () => {
  const slots = [];
  let currentHour = START_HOUR;
  let currentMinute = 0;
  while (currentHour < END_HOUR || (currentHour === END_HOUR && currentMinute <= 0)) {
    const h = String(currentHour).padStart(2, '0');
    const m = String(currentMinute).padStart(2, '0');
    slots.push(h + ':' + m);
    currentMinute += 30;
    if (currentMinute === 60) { currentMinute = 0; currentHour++; }
  }
  return slots;
};

// Get user-friendly timezone name
const getTimezoneDisplay = (tz) => {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      timeZoneName: 'short'
    });
    const parts = formatter.formatToParts(now);
    const tzName = parts.find(p => p.type === 'timeZoneName')?.value || tz;
    return tzName;
  } catch {
    return tz;
  }
};

const BookingForm = ({ date, time, onConfirm, onBack, isSubmitting, userTimezone }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [showGuestInput, setShowGuestInput] = useState(false);
  const [guestEmail, setGuestEmail] = useState('');
  const [guests, setGuests] = useState([]);

  const handleSubmit = (e) => { e.preventDefault(); onConfirm({ name, email, notes, guests }); };
  const handleAddGuest = (e) => {
    e.preventDefault();
    if (guestEmail && guestEmail.includes('@') && !guests.includes(guestEmail)) {
      setGuests([...guests, guestEmail]);
      setGuestEmail('');
    }
  };
  const removeGuest = (emailToRemove) => setGuests(guests.filter(g => g !== emailToRemove));

  return (
    <div className="h-full flex flex-col">
      <div className="mb-6">
        <button onClick={onBack} className="text-sm text-gray-500 hover:text-gray-800 flex items-center gap-1 mb-4">
          <ChevronLeft size={16} /> Back to times
        </button>
        <h3 className="text-xl font-bold text-gray-900">Enter Details</h3>
        <p className="text-gray-500 text-sm mt-1">
          {date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} at {time}
          <span className="text-xs ml-1">({getTimezoneDisplay(userTimezone)})</span>
        </p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4 flex-1 overflow-y-auto pr-2">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
          <div className="relative">
            <User size={16} className="absolute left-3 top-3 text-gray-400" />
            <input required type="text" value={name} onChange={(e) => setName(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="John Doe" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
          <div className="relative">
            <Mail size={16} className="absolute left-3 top-3 text-gray-400" />
            <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="john@example.com" />
          </div>
        </div>
        <div>
          {!showGuestInput ? (
            <button type="button" onClick={() => setShowGuestInput(true)}
              className="text-sm text-blue-600 font-medium flex items-center gap-1 hover:text-blue-700">
              <Plus size={16} /> Add Guests
            </button>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Guest Emails</label>
              <div className="flex gap-2 mb-2">
                <div className="relative flex-1">
                  <Users size={16} className="absolute left-3 top-3 text-gray-400" />
                  <input type="email" value={guestEmail} onChange={(e) => setGuestEmail(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddGuest(e); } }}
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="guest@example.com" />
                </div>
                <button type="button" onClick={handleAddGuest} disabled={!guestEmail}
                  className="px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 disabled:opacity-50">Add</button>
              </div>
              {guests.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {guests.map((guest, index) => (
                    <div key={index} className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full border border-blue-100">
                      {guest}
                      <button type="button" onClick={() => removeGuest(guest)} className="p-0.5 hover:bg-blue-100 rounded-full">
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
            placeholder="Please share anything that will help prepare for our meeting." />
        </div>
        <button type="submit" disabled={isSubmitting}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-lg shadow-md flex items-center justify-center gap-2 mt-4">
          {isSubmitting ? 'Scheduling...' : <><span>Schedule Event</span> <ArrowRight size={18} /></>}
        </button>
      </form>
    </div>
  );
};

export default function BookingApp() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [viewState, setViewState] = useState('calendar');
  const [busySlots, setBusySlots] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userTimezone, setUserTimezone] = useState('UTC');

  // Detect user's timezone on mount
  useEffect(() => {
    try {
      const detectedTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      setUserTimezone(detectedTz || 'UTC');
    } catch {
      console.warn('Could not detect timezone, defaulting to UTC');
      setUserTimezone('UTC');
    }
  }, []);

  // Fetch busy slots with user's timezone
  useEffect(() => {
    if (userTimezone) {
      fetch('/api/availability?tz=' + encodeURIComponent(userTimezone))
        .then(res => res.json())
        .then(data => { 
          if (data.slots && Array.isArray(data.slots)) {
            setBusySlots(data.slots);
          } else if (Array.isArray(data)) {
            // Fallback for old API format
            setBusySlots(data);
          }
        })
        .catch(err => console.error("Failed to load availability", err));
    }
  }, [userTimezone]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDayOfMonth = getFirstDayOfMonth(year, month);
  const paddingDays = Array(firstDayOfMonth).fill(null);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  
  const handleDateClick = (day) => {
    const newDate = new Date(year, month, day);
    if (newDate < new Date().setHours(0,0,0,0)) return;
    setSelectedDate(newDate);
    setSelectedTime(null);
    setViewState('calendar');
  };

  const handleTimeSelect = (time) => { setSelectedTime(time); setViewState('form'); };

  const handleBookingConfirm = async (details) => {
    setIsSubmitting(true);
    const startTime = formatDateId(selectedDate) + 'T' + selectedTime + ':00';
    const startDateObj = new Date(startTime);
    const endDateObj = new Date(startDateObj.getTime() + 30 * 60000);
    try {
      const res = await fetch('/api/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: details.name, 
          email: details.email, 
          notes: details.notes, 
          guests: details.guests,
          startTime: startDateObj.toISOString(), 
          endTime: endDateObj.toISOString(),
          userTimezone: userTimezone // Pass user's timezone
        })
      });
      if (res.ok) { setViewState('success'); } else { alert("Something went wrong."); }
    } catch (error) { console.error(error); alert("Failed to connect to server."); }
    finally { setIsSubmitting(false); }
  };

  const isSlotAvailable = (dateStr, timeStr) => {
    // Create slot time in user's local timezone
    const [year, month, day] = dateStr.split('-').map(Number);
    const [hour, minute] = timeStr.split(':').map(Number);
    const slotStart = new Date(year, month - 1, day, hour, minute, 0);
    const slotEnd = new Date(slotStart.getTime() + 30 * 60000);
    
    return !busySlots.some(busy => {
      const busyStart = new Date(busy.start);
      const busyEnd = new Date(busy.end);
      return (slotStart.getTime() < busyEnd.getTime() && slotEnd.getTime() > busyStart.getTime());
    });
  };

  const timeSlots = generateTimeSlots();

  if (viewState === 'success') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={32} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Booking Confirmed!</h2>
          <p className="text-gray-500 mb-6">A calendar invitation has been sent to your email.</p>
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-100 mb-8 text-left">
            <div className="flex items-center gap-3 mb-2">
              <CalendarIcon size={18} className="text-blue-600" />
              <span className="font-medium text-gray-700">
                {selectedDate && selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </span>
            </div>
            <div className="flex items-center gap-3 mb-2">
              <Clock size={18} className="text-blue-600" />
              <span className="font-medium text-gray-700">{selectedTime}</span>
            </div>
            <div className="flex items-center gap-3">
              <Globe size={18} className="text-blue-600" />
              <span className="font-medium text-gray-700">{getTimezoneDisplay(userTimezone)}</span>
            </div>
          </div>
          <button onClick={() => { setViewState('calendar'); setSelectedDate(null); }}
            className="w-full py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50">
            Book Another
          </button>
        </div>
      </div>
    );
  }

  const getButtonClass = (isSelected, isPast, isWeekend, isToday) => {
    let base = "h-10 w-10 md:h-12 md:w-full rounded-full md:rounded-lg flex items-center justify-center text-sm font-medium ";
    if (isSelected) return base + "bg-blue-600 text-white shadow-md";
    if (isPast || isWeekend) return base + "text-gray-300 cursor-not-allowed";
    if (isToday) return base + "text-blue-600 font-bold bg-blue-50";
    return base + "text-gray-700 hover:bg-blue-50 hover:text-blue-600";
  };

  const getTimeButtonClass = (isAvailable) => {
    let base = "w-full py-2.5 px-4 rounded-lg border text-sm font-medium flex items-center justify-center gap-2 ";
    if (isAvailable) return base + "border-blue-200 text-blue-600 hover:border-blue-600 hover:bg-blue-50";
    return base + "border-transparent bg-gray-50 text-gray-300 cursor-not-allowed";
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 font-sans text-black">
      <div className="bg-white rounded-2xl shadow-xl max-w-5xl w-full flex flex-col md:flex-row overflow-hidden min-h-[600px] border border-gray-100">
        <div className="w-full md:w-1/3 bg-gray-50 border-r border-gray-200 p-8 flex flex-col">
          <div className="mb-8">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center text-white mb-4 shadow-lg">
              <Video size={24} />
            </div>
            <p className="text-gray-500 font-medium text-sm mb-1">Jake Hewlett</p>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">MindsetOS</h1>
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-gray-600"><Clock size={18} className="text-gray-400" /><span>30 mins</span></div>
              <div className="flex items-center gap-3 text-gray-600"><Video size={18} className="text-gray-400" /><span>Google Meets</span></div>
            </div>
          </div>
          <div className="mt-auto pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-500 mb-3">Choose an available slot that works for you.</p>
            <div className="flex items-center gap-2 mt-6 bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
              <ShieldCheck size={16} className="text-green-600"/> 
              <span className="text-xs font-medium text-gray-600">Synced with Google Calendar</span>
            </div>
          </div>
        </div>
        <div className="flex-1 p-8 overflow-y-auto">
          {viewState === 'form' ? (
            <BookingForm date={selectedDate} time={selectedTime} onConfirm={handleBookingConfirm}
              onBack={() => setViewState('calendar')} isSubmitting={isSubmitting} userTimezone={userTimezone} />
          ) : (
            <div className="flex flex-col md:flex-row h-full gap-8">
              <div className={selectedDate ? "flex-1 md:w-3/5" : "flex-1 w-full"}>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold text-gray-800">{MONTHS[month]} {year}</h2>
                  <div className="flex gap-1">
                    <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-full text-gray-600"><ChevronLeft size={20} /></button>
                    <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-full text-gray-600"><ChevronRight size={20} /></button>
                  </div>
                </div>
                <div className="grid grid-cols-7 mb-2">
                  {DAYS.map(day => (<div key={day} className="text-center text-xs font-medium text-gray-400 py-2 uppercase">{day}</div>))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {paddingDays.map((_, i) => <div key={"pad-" + i} />)}
                  {days.map(day => {
                    const date = new Date(year, month, day);
                    const isPast = date < new Date().setHours(0,0,0,0);
                    const isToday = date.toDateString() === new Date().toDateString();
                    const isSelected = selectedDate && selectedDate.toDateString() === date.toDateString();
                    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                    return (
                      <button key={day} disabled={isPast || isWeekend} onClick={() => handleDateClick(day)}
                        className={getButtonClass(isSelected, isPast, isWeekend, isToday)}>
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>
              {selectedDate && (
                <div className="w-full md:w-64 border-l border-gray-100 pl-0 md:pl-8 mt-6 md:mt-0">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                  </h3>
                  {/* Timezone indicator */}
                  <div className="flex items-center gap-2 mb-4 text-xs text-gray-500 bg-gray-50 px-3 py-2 rounded-lg">
                    <Globe size={14} />
                    <span>Times shown in {getTimezoneDisplay(userTimezone)}</span>
                  </div>
                  <div className="space-y-2 max-h-[350px] overflow-y-auto pr-2">
                    {timeSlots.map(time => {
                      const isAvailable = isSlotAvailable(formatDateId(selectedDate), time);
                      return (
                        <button key={time} disabled={!isAvailable} onClick={() => handleTimeSelect(time)}
                          className={getTimeButtonClass(isAvailable)}>
                          {time}
                          {!isAvailable && <span className="text-[10px] uppercase tracking-wider">(Busy)</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
