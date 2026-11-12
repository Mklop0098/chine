export const MINUTE = 60000;
const DAY = 1440 * MINUTE;
const BEIJING_OFFSET = 8 * 60 * MINUTE;
const GAME_TIME_RATE = 5 / 60;
const PRECIPITATION_DAYS = [2, 3, 4, 5, 6, 9, 14, 12, 7, 5, 3, 2];

// Store Beijing wall time on a UTC calendar so browser time zones cannot shift game dates.
let realAnchor = Date.now();
let gameAnchor = realAnchor + BEIJING_OFFSET;

export function gameTime(now = Date.now()) {
 return gameAnchor + (now - realAnchor) * GAME_TIME_RATE;
}

export function seekGameTime(timestamp, now = Date.now()) {
 if (!Number.isFinite(timestamp)) return;
 gameAnchor = timestamp;
 realAnchor = now;
}

function fraction(day, salt) {
 let value = Math.imul(day ^ salt, 0x45d9f3b);
 value = Math.imul(value ^ (value >>> 16), 0x45d9f3b);
 return ((value ^ (value >>> 16)) >>> 0) / 4294967296;
}

export function calendarAt(timestamp) {
 const date = new Date(timestamp);
 const month = date.getUTCMonth();
 const day = Math.floor(timestamp / DAY);
 const minute = date.getUTCHours() * 60 + date.getUTCMinutes();
 const dayOfYear = day - Math.floor(Date.UTC(date.getUTCFullYear(), 0, 1) / DAY);
 const summer = Math.cos((dayOfYear - 171) * 2 * Math.PI / 365.25);
 const sunrise = Math.round(366 - 78 * summer);
 const sunset = Math.round(1092 + 84 * summer);
 const phase = minute < sunrise - 30 || minute >= sunset + 30 ? 'night'
  : minute < sunrise + 30 ? 'dawn' : minute >= sunset - 30 ? 'dusk' : 'day';
 const snowy = month <= 2 || month >= 10;
 const monthDays = new Date(Date.UTC(date.getUTCFullYear(), month + 1, 0)).getUTCDate();
 const start = Math.floor(fraction(day, 71) * 1040);
 const duration = 160 + Math.floor(fraction(day, 193) * 240);
 const wet = fraction(day, 37) < PRECIPITATION_DAYS[month] / monthDays
  && minute >= start && minute < start + duration;
 return {
  date: date.toISOString().slice(0, 10),
  minute, sunrise, sunset, phase, snowy,
  weather: wet ? (snowy ? 'snow' : 'rain') : 'clear',
 };
}
