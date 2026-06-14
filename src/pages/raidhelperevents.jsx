import { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import "./raidhelperevents.css";

const API = import.meta.env.VITE_API;



function getDateKeyFromDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getDateKeyFromTimestamp(value) {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return getDateKeyFromDate(date);
}

function formatTime(event) {
  if (event.localTime) return event.localTime;

  const value = event.startTime || event.start_time;
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function RaidHelperEvents() {
  const { token } = useAuth();
  const [events, setEvents] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    async function fetchEvents() {
      const res = await fetch(`${API}/api/raidhelper/imported`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();

      const mappedEvents = data.map((raid) => {
        const raw = raid.raw_json || {};

        return {
          ...raid,
          startTime: raw.startTime || raid.start_time,
          localDate: raw.localDate || getDateKeyFromTimestamp(raw.startTime || raid.start_time),
          localTime: raw.localTime || null,
          guildName: raw.guildName || raid.guild_name || null,
          signupCount: raw.signupCount ?? raid.signup_count,
          signupMax: raw.signupMax ?? raid.signup_max,
          title: raw.title || raid.title,
        };
      });

      setEvents(mappedEvents);
      console.log("Mapped raid calendar events:", mappedEvents);
    }

    if (token) fetchEvents();
  }, [token]);

  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  const blanks = Array(firstDay.getDay()).fill(null);
  const days = Array.from({ length: lastDay.getDate() }, (_, i) => {
    return new Date(year, month, i + 1);
  });

  const calendarDays = [...blanks, ...days];



  const filteredEvents = events.filter((event) => {
    const searchText = `
      ${event.raid_name || ""}
      ${event.raid_leader || ""}
      ${event.guild_name || ""}
    `.toLowerCase();

    return searchText.includes(searchTerm.toLowerCase());
  });

  function eventsForDay(day) {
    if (!day) return [];

    const dayKey = getDateKeyFromDate(day);
    // return events.filter((event) => event.localDate === dayKey);
    return filteredEvents.filter((event) => event.localDate === dayKey);
  }

  return (
    <main className="raid-calendar-page">
      <h1>Raid Calendar</h1>
      <h2>
        {today.toLocaleString("default", { month: "long" })} {year}        
      </h2>
      <input
        className="raid-calendar-search"
        type="text"
        placeholder="Search raids, leaders, guilds..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />


      <section className="raid-calendar">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div className="raid-calendar__header" key={day}>
            {day}
          </div>
        ))}

        {calendarDays.map((day, index) => (
          <div className="raid-calendar__day" key={index}>
            {day && (
              <>
                <div className="raid-calendar__date">{day.getDate()}</div>

                  {eventsForDay(day).map((event) => (
                    <a
                      className="raid-calendar__event"
                      key={event.raidhelper_event_id}
                      href={`https://discord.com/channels/${event.guild_id}/${event.channel_id}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <strong>{formatTime(event)}</strong>
                      <span>{event.guildName}</span>                      
                      <span>{event.raid_name || event.title}</span>
                      {/* {event.raid_leader} */}
                    </a>
                  ))}
              </>
            )}
          </div>
        ))}
      </section>
    </main>
  );
}
