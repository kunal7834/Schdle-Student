import React, { useState, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, MapPin } from 'lucide-react';

// ---------------- Constants ----------------
const SECTIONS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'LSM', 'FIN'];

const API_URL = process.env.REACT_APP_API_URL || '';

const emptyRosters = () => Object.fromEntries(SECTIONS.map(s => [s, []]));

// Helper: derive a student's first-name password from full name ("GOKUL SAJI" → "Gokul")
const firstNamePassword = (fullName) => {
  if (!fullName) return '';
  const first = String(fullName).trim().split(/\s+/)[0] || '';
  return first.charAt(0).toUpperCase() + first.slice(1).toLowerCase();
};

// Event color coding by which admin office scheduled it
const EVENT_STYLES = {
  'placement@iimk.ac.in': { border: 'border-violet-500', bg: 'bg-violet-50', text: 'text-violet-600', badgeBorder: 'border-violet-200', dot: 'bg-violet-500' },
  'programme@iimk.ac.in': { border: 'border-sky-500', bg: 'bg-sky-50', text: 'text-sky-600', badgeBorder: 'border-sky-200', dot: 'bg-sky-500' },
};
const DEFAULT_EVENT_STYLE = { border: 'border-sky-500', bg: 'bg-sky-50', text: 'text-sky-600', badgeBorder: 'border-sky-200', dot: 'bg-sky-500' };
const getEventStyle = (event) => EVENT_STYLES[String(event?.createdBy || '').trim().toLowerCase()] || DEFAULT_EVENT_STYLE;

// ---------------- IIMK Header Banner ----------------
const IIMKHeader = () => (
  <div className="w-full bg-white border-b border-slate-200 shadow-sm">
    <div className="max-w-7xl mx-auto px-6 py-3">
      <img src="/iimklogo.png" alt="Indian Institute of Management Kozhikode" className="h-20 w-auto object-contain object-left" />
    </div>
  </div>
);

// ---------------- Calendar View ----------------
const CalendarView = ({ currentMonth, setCurrentMonth, selectedDate, setSelectedDate, getEventsForDate, viewMode, setViewMode, showViewToggle = true }) => {
  const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const daysOfWeek = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

  const today = new Date();
  const fmt = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  const todayStr = fmt(today);

  // Selected-date anchored week (Sunday to Saturday)
  const selDate = new Date(selectedDate);
  const weekStart = new Date(selDate);
  weekStart.setDate(selDate.getDate() - selDate.getDay());
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  const navigate = (offset) => {
    if (viewMode === 'week') {
      const d = new Date(selDate);
      d.setDate(selDate.getDate() + offset * 7);
      setSelectedDate(fmt(d));
      setCurrentMonth({ year: d.getFullYear(), month: d.getMonth() });
    } else {
      const d = new Date(currentMonth.year, currentMonth.month + offset, 1);
      setCurrentMonth({ year: d.getFullYear(), month: d.getMonth() });
    }
  };

  const renderDayCell = (dateStr, dayLabel, key) => {
    const isSelected = dateStr === selectedDate;
    const isToday = dateStr === todayStr;
    const dayEvents = getEventsForDate(dateStr);
    const count = dayEvents.length;
    return (
      <button
        key={key}
        data-testid={`calendar-day-${dateStr}`}
        onClick={() => setSelectedDate(dateStr)}
        className={`aspect-square p-1 sm:p-2 rounded-lg transition-all relative ${
          isSelected ? 'bg-sky-500 text-white shadow-lg'
            : isToday ? 'bg-sky-100 text-sky-700 font-semibold'
            : 'hover:bg-slate-100'
        }`}
      >
        <div className="text-xs sm:text-sm">{dayLabel}</div>
        {count > 0 && (
          <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 flex gap-0.5">
            {dayEvents.slice(0, 3).map((event, i) => (
              <div key={i} className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white' : getEventStyle(event).dot}`} />
            ))}
          </div>
        )}
      </button>
    );
  };

  // Month cells
  let cells = [];
  if (viewMode === 'month') {
    const daysInMonth = new Date(currentMonth.year, currentMonth.month + 1, 0).getDate();
    const firstDay = new Date(currentMonth.year, currentMonth.month, 1).getDay();
    for (let i = 0; i < firstDay; i++) cells.push(<div key={`e-${i}`} className="aspect-square" />);
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${currentMonth.year}-${String(currentMonth.month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
      cells.push(renderDayCell(dateStr, day, day));
    }
  } else {
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      cells.push(renderDayCell(fmt(d), d.getDate(), i));
    }
  }

  const headerTitle = viewMode === 'month'
    ? `${monthNames[currentMonth.month]} ${currentMonth.year}`
    : (() => {
        const sameMonth = weekStart.getMonth() === weekEnd.getMonth();
        const startStr = `${monthNames[weekStart.getMonth()].slice(0,3)} ${weekStart.getDate()}`;
        const endStr = sameMonth
          ? `${weekEnd.getDate()}, ${weekEnd.getFullYear()}`
          : `${monthNames[weekEnd.getMonth()].slice(0,3)} ${weekEnd.getDate()}, ${weekEnd.getFullYear()}`;
        return `${startStr} – ${endStr}`;
      })();

  const toggleBase = 'px-3 py-1.5 text-xs font-semibold rounded-md transition-colors';
  const activeToggle = 'bg-sky-500 text-white';
  const inactiveToggle = 'bg-slate-100 text-slate-600 hover:bg-slate-200';

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-3 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <button data-testid="calendar-prev-month" onClick={() => navigate(-1)} className="p-2 rounded-lg transition-colors hover:bg-sky-100 text-sky-500">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h2 className="text-lg sm:text-2xl font-bold text-slate-900 text-center">{headerTitle}</h2>
        <button data-testid="calendar-next-month" onClick={() => navigate(1)} className="p-2 rounded-lg transition-colors hover:bg-sky-100 text-sky-500">
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>
      {showViewToggle && (
        <div className="flex justify-center gap-1 mb-4 bg-slate-50 p-1 rounded-lg w-fit mx-auto">
          <button
            data-testid="calendar-view-month"
            onClick={() => setViewMode('month')}
            className={`${toggleBase} ${viewMode === 'month' ? activeToggle : inactiveToggle}`}
          >Month</button>
          <button
            data-testid="calendar-view-week"
            onClick={() => setViewMode('week')}
            className={`${toggleBase} ${viewMode === 'week' ? activeToggle : inactiveToggle}`}
          >Week</button>
        </div>
      )}
      <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2">
        {daysOfWeek.map(d => <div key={d} className="text-center text-xs sm:text-sm font-semibold text-slate-600 py-2">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1 sm:gap-2">{cells}</div>
    </div>
  );
};

// ---------------- Student Login ----------------
const StudentLogin = ({ onLogin, rosters, groups }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const submit = (e) => {
    e?.preventDefault();
    const wantedEmail = email.trim().toLowerCase();
    const wantedPwd = password.trim();
    if (!wantedEmail || !wantedPwd) { setError('Please enter your email and first name.'); return; }
    // Search every section for a roster entry whose email matches and first-name == password (case-insensitive)
    for (const sec of SECTIONS) {
      for (const s of (rosters[sec] || [])) {
        if (String(s.email).trim().toLowerCase() === wantedEmail) {
          const fn = firstNamePassword(s.name);
          if (fn.toLowerCase() === wantedPwd.toLowerCase()) {
            setError('');
            const myGroups = Object.keys(groups || {}).filter(g =>
              (groups[g] || []).some(m => String(m.email).trim().toLowerCase() === wantedEmail)
            );
            onLogin({ name: s.name, email: s.email, rollNumber: s.rollNumber, section: sec, groups: myGroups });
            return;
          }
        }
      }
    }
    setError('Invalid email or first name. Make sure your section roster has been uploaded.');
  };

  return (
    <div className="min-h-screen bg-white flex flex-col relative overflow-hidden">
      <IIMKHeader />
      <div className="pointer-events-none absolute -top-32 -left-32 w-96 h-96 rounded-full bg-sky-100/60 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-32 w-[28rem] h-[28rem] rounded-full bg-blue-100/60 blur-3xl" />
      <div className="bg-white border-b border-slate-200 relative">
        <div className="max-w-6xl mx-auto flex items-center gap-3 px-6 py-4">
          <div className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-sky-500">
            <Calendar className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-base font-semibold text-slate-900 tracking-tight">Student Portal</h1>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center p-6 relative">
        <form onSubmit={submit} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 max-w-md w-full space-y-4">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900 tracking-tight">Student Login</h2>
            <p className="text-sm text-slate-500 mt-1">Sign in with your IIMK email. Password is your first name.</p>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1.5 block">Email</label>
            <input
              data-testid="student-email-input"
              type="text"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-shadow"
              placeholder="e.g. mba25gokul@iimk.ac.in"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1.5 block">First Name</label>
            <input
              data-testid="student-password-input"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-shadow"
              placeholder="e.g. Gokul"
            />
          </div>
          {error && <div data-testid="student-login-error" className="text-red-600 text-sm">{error}</div>}
          <button
            data-testid="student-login-submit"
            type="submit"
            className="w-full bg-sky-500 text-white py-2.5 rounded-xl hover:bg-sky-600 font-medium transition-all text-sm shadow-sm shadow-sky-500/20"
          >
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
};

// ---------------- Student Platform ----------------
const StudentPlatform = () => {
  const [events, setEvents] = useState([]);
  const [rosters, setRosters] = useState(emptyRosters());
  const [groups, setGroups] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [session, setSession] = useState(null); // { name, email, rollNumber, section, groups }

  const today = new Date();
  const fmt = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  const todayStr = fmt(today);
  const [currentMonth, setCurrentMonth] = useState({ year: today.getFullYear(), month: today.getMonth() });
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [viewMode, setViewMode] = useState('month');
  const [studentView, setStudentView] = useState('today'); // 'today' | 'week' | 'month'

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!API_URL) {
        if (!cancelled) setLoadError('REACT_APP_API_URL is not set. Configure it in your deployment environment variables.');
        if (!cancelled) setLoading(false);
        return;
      }
      try {
        const [eventsRes, rostersRes] = await Promise.all([
          fetch(`${API_URL}/api/events`),
          fetch(`${API_URL}/api/rosters`),
        ]);
        if (!eventsRes.ok) throw new Error(`GET ${API_URL}/api/events failed (${eventsRes.status}).`);
        if (!rostersRes.ok) throw new Error(`GET ${API_URL}/api/rosters failed (${rostersRes.status}).`);
        const eventsData = await eventsRes.json();
        const rostersData = await rostersRes.json();
        if (!cancelled) {
          setEvents(Array.isArray(eventsData) ? eventsData : []);
          const { groups: groupsData, ...sectionRosters } = rostersData || {};
          setRosters({ ...emptyRosters(), ...sectionRosters });
          setGroups(groupsData || {});
        }
      } catch (err) {
        if (!cancelled) setLoadError(`Failed to load data from ${API_URL}. ${err.message || ''} This is usually caused by the API being unreachable or CORS not allowing this site's origin.`);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  const logout = () => setSession(null);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-500 text-sm">Loading…</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-4 py-3 max-w-md text-center">{loadError}</div>
      </div>
    );
  }

  if (!session) {
    return <StudentLogin onLogin={setSession} rosters={rosters} groups={groups} />;
  }

  const myEvents = events.filter(e => (e.sections || []).some(s => s === session.section || (session.groups || []).includes(s)));
  const getEventsForDate = (date) => myEvents.filter(e => e.date === date);
  const selectedDateEvents = getEventsForDate(selectedDate).sort((a, b) => a.time.localeCompare(b.time));
  const upcoming = myEvents
    .filter(e => new Date(e.date) >= new Date(new Date().setHours(0,0,0,0)))
    .sort((a, b) => new Date(`${a.date}T${a.time}`) - new Date(`${b.date}T${b.time}`))
    .slice(0, 8);

  const shiftDay = (offset) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + offset);
    setSelectedDate(fmt(d));
  };

  const selectView = (mode) => {
    setStudentView(mode);
    if (mode === 'today') {
      setSelectedDate(todayStr);
      setCurrentMonth({ year: today.getFullYear(), month: today.getMonth() });
    } else {
      setViewMode(mode);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex justify-between items-center gap-2 px-3 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-sky-500 shrink-0">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base font-semibold text-slate-900 tracking-tight">Student Portal</h1>
              <p className="text-xs text-slate-500 truncate" data-testid="student-current-user">
                {session.name} · Sec {session.section}
              </p>
            </div>
          </div>
          <button data-testid="student-logout-btn" onClick={logout} className="bg-slate-900 hover:bg-slate-700 text-white px-3 sm:px-4 py-2 rounded-lg transition-colors text-sm font-medium shrink-0">Logout</button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-3 sm:p-6">
        <div className="flex gap-1 mb-4 bg-slate-100 p-1 rounded-lg w-full sm:w-fit">
          {[
            { key: 'today', label: 'Today' },
            { key: 'week', label: 'Week' },
            { key: 'month', label: 'Month' },
          ].map(({ key, label }) => (
            <button
              key={key}
              data-testid={`student-view-${key}`}
              onClick={() => selectView(key)}
              className={`flex-1 sm:flex-none px-4 py-1.5 text-sm font-semibold rounded-md transition-colors ${studentView === key ? 'bg-sky-500 text-white' : 'text-slate-600 hover:bg-slate-200'}`}
            >{label}</button>
          ))}
        </div>

        {studentView === 'today' ? (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-3 sm:p-4 flex items-center justify-between">
              <button data-testid="student-day-prev" onClick={() => shiftDay(-1)} className="p-2 rounded-lg hover:bg-sky-100 text-sky-500 transition-colors">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="text-center">
                <div className="text-sm sm:text-base font-semibold text-slate-900">
                  {selectedDate === todayStr ? 'Today' : new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long' })}
                </div>
                <div className="text-xs text-slate-500">{new Date(selectedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
              </div>
              <button data-testid="student-day-next" onClick={() => shiftDay(1)} className="p-2 rounded-lg hover:bg-sky-100 text-sky-500 transition-colors">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
            {selectedDate !== todayStr && (
              <button data-testid="student-jump-today" onClick={() => setSelectedDate(todayStr)} className="text-xs text-sky-600 font-semibold hover:underline">
                ← Jump to today
              </button>
            )}

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4 tracking-tight">Today's Events</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {selectedDateEvents.length === 0 ? (
                  <p data-testid="student-no-events" className="text-slate-500 text-center py-4 text-sm">No classes for this date</p>
                ) : selectedDateEvents.map(event => {
                  const style = getEventStyle(event);
                  return (
                  <div key={event.id} data-testid={`student-event-${event.id}`} className={`border-l-4 ${style.border} ${style.bg} rounded-lg p-3`}>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`${style.text} font-semibold text-sm`}>{event.time}</span>
                      {event.venue && (
                        <span className={`inline-flex items-center gap-1 text-xs bg-white ${style.text} px-2 py-0.5 rounded border ${style.badgeBorder}`}>
                          <MapPin className="w-3 h-3" /> {event.venue}
                        </span>
                      )}
                    </div>
                    <h4 className="font-semibold text-slate-900">{event.title}</h4>
                    {event.description && <p className="text-slate-600 text-sm mt-1">{event.description}</p>}
                  </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4 tracking-tight">Upcoming Classes</h3>
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {upcoming.length === 0 ? (
                  <p className="text-slate-500 text-center py-4 text-sm">No upcoming classes</p>
                ) : upcoming.map(event => (
                  <div key={event.id} className="border border-slate-200 rounded-lg p-3 hover:shadow-md transition-shadow">
                    <div className="flex gap-2 text-xs text-slate-500 mb-1 flex-wrap">
                      <span>{event.date}</span>
                      <span>·</span>
                      <span>{event.time}</span>
                      {event.venue && <span className="inline-flex items-center gap-1">· <MapPin className="w-3 h-3" />{event.venue}</span>}
                    </div>
                    <h4 className="font-semibold text-slate-900 text-sm">{event.title}</h4>
                    {event.description && <p className="text-slate-600 text-xs mt-1">{event.description}</p>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
            <div className="lg:col-span-2">
              <CalendarView
                currentMonth={currentMonth}
                setCurrentMonth={setCurrentMonth}
                selectedDate={selectedDate}
                setSelectedDate={setSelectedDate}
                getEventsForDate={getEventsForDate}
                viewMode={viewMode}
                setViewMode={setViewMode}
                showViewToggle={false}
              />
            </div>

            <div className="space-y-4 sm:space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4 tracking-tight">
                  {new Date(selectedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </h3>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {selectedDateEvents.length === 0 ? (
                    <p data-testid="student-no-events" className="text-slate-500 text-center py-4 text-sm">No classes for this date</p>
                  ) : selectedDateEvents.map(event => {
                    const style = getEventStyle(event);
                    return (
                    <div key={event.id} data-testid={`student-event-${event.id}`} className={`border-l-4 ${style.border} ${style.bg} rounded-lg p-3`}>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={`${style.text} font-semibold text-sm`}>{event.time}</span>
                        {event.venue && (
                          <span className={`inline-flex items-center gap-1 text-xs bg-white ${style.text} px-2 py-0.5 rounded border ${style.badgeBorder}`}>
                            <MapPin className="w-3 h-3" /> {event.venue}
                          </span>
                        )}
                      </div>
                      <h4 className="font-semibold text-slate-900">{event.title}</h4>
                      {event.description && <p className="text-slate-600 text-sm mt-1">{event.description}</p>}
                    </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4 tracking-tight">Upcoming Classes</h3>
                <div className="space-y-2 max-h-72 overflow-y-auto">
                  {upcoming.length === 0 ? (
                    <p className="text-slate-500 text-center py-4 text-sm">No upcoming classes</p>
                  ) : upcoming.map(event => (
                    <div key={event.id} className="border border-slate-200 rounded-lg p-3 hover:shadow-md transition-shadow">
                      <div className="flex gap-2 text-xs text-slate-500 mb-1 flex-wrap">
                        <span>{event.date}</span>
                        <span>·</span>
                        <span>{event.time}</span>
                        {event.venue && <span className="inline-flex items-center gap-1">· <MapPin className="w-3 h-3" />{event.venue}</span>}
                      </div>
                      <h4 className="font-semibold text-slate-900 text-sm">{event.title}</h4>
                      {event.description && <p className="text-slate-600 text-xs mt-1">{event.description}</p>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ---------------- App ----------------
function App() {
  return <StudentPlatform />;
}

export default App;
