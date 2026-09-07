const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

/**
 * Returns YYYY-MM-DD for a given Date object or string in local time.
 */
export function toLocalISODate(date = new Date()) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Formats a month and year into human readable string e.g. "September 2026".
 */
export function formatMonthYear(month, year) {
  const mIndex = Number(month) - 1;
  const mName = MONTH_NAMES[mIndex] || '';
  return `${mName} ${year}`;
}

/**
 * Returns relative human-readable label: "Today", "Yesterday", or "7 Sep".
 */
export function getRelativeDateLabel(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();

  const todayStr = toLocalISODate(now);
  
  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);
  const yesterdayStr = toLocalISODate(yesterday);

  const targetDateStr = toLocalISODate(d);

  if (targetDateStr === todayStr) {
    return 'Today';
  }
  if (targetDateStr === yesterdayStr) {
    return 'Yesterday';
  }

  const day = d.getDate();
  const monthShort = d.toLocaleDateString('en-US', { month: 'short' });
  return `${day} ${monthShort}`;
}

/**
 * Formats full human date e.g. "7 September 2026".
 */
export function formatFullDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Formats time string e.g. "12:30 PM".
 */
export function formatTime(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Returns month names list.
 */
export function getMonthNames() {
  return MONTH_NAMES;
}

