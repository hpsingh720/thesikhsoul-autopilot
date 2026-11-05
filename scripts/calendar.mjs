// Occasion calendar. ONLY content/calendar.json decides occasion posts.
// Tone comes from the event's "kind", never from guessing at the name.
import fs from "node:fs";
import path from "node:path";

export const CELEBRATE = new Set(["parkash", "gurgaddi", "purab"]);
export const SOLEMN = new Set(["joti-jot", "shaheedi", "remembrance"]);
export const KINDS = [...CELEBRATE, ...SOLEMN];

const file = path.join(process.cwd(), "content/calendar.json");

export const loadCalendar = () => {
  try { return JSON.parse(fs.readFileSync(file, "utf8")); }
  catch { return { events: [] }; }
};
export const saveCalendar = (cal) => fs.writeFileSync(file, JSON.stringify(cal, null, 2));

export const eventsOn = (ymd) => loadCalendar().events.filter((e) => e.date === ymd && KINDS.includes(e.kind));

export const toneOf = (ev) => {
  if (SOLEMN.has(ev.kind)) {
    const greeting = ev.kind === "joti-jot" ? "ਜੋਤੀ ਜੋਤ ਦਿਵਸ ਤੇ ਕੋਟਿ ਕੋਟਿ ਪ੍ਰਣਾਮ" : "ਕੋਟਿ ਕੋਟਿ ਪ੍ਰਣਾਮ";
    const capLead = ev.kind === "joti-jot"
      ? `🙏 ${ev.en}\n${ev.pa || ""}\n\nWith deepest shardha, we remember. Kot Kot Parnaam.`
      : `🙏 ${ev.en}\n${ev.pa || ""}\n\nWe bow to the sacrifice. Kot Kot Parnaam.`;
    return { solemn: true, greeting, capLead, textStyle: "simple" };
  }
  if (CELEBRATE.has(ev.kind)) {
    return {
      solemn: false,
      greeting: "ਲੱਖ ਲੱਖ ਵਧਾਈਆਂ",
      capLead: `🌸 ${ev.en}\n${ev.pa || ""}\n\nLakh Lakh Vadhaiyan to the entire Sangat!`,
      textStyle: "shine",
    };
  }
  return null; // unknown kind = no occasion post at all
};

// When two events share a day, the solemn one leads. Never celebrate over a shaheedi.
export const leadEvent = (events) => {
  const s = events.find((e) => SOLEMN.has(e.kind));
  return s || events[0] || null;
};
