export function parseLapTime(lapTimeStr: string | null): number | null {
  if (!lapTimeStr || lapTimeStr === 'None' || lapTimeStr === 'NaT') return null;

  // Format: "0 days 00:01:23.456000" or "00:01:23.456000"
  const match = lapTimeStr.match(/(\d{2}):(\d{2}):(\d{2})\.(\d+)/);
  if (match) {
    const [, h, m, s, ms] = match;
    return (
      parseInt(h) * 3600 +
      parseInt(m) * 60 +
      parseInt(s) +
      parseInt(ms.substring(0, 3)) / 1000
    );
  }

  // Format: "1:23.456"
  const shortMatch = lapTimeStr.match(/(\d+):(\d{2})\.(\d+)/);
  if (shortMatch) {
    const [, m, s, ms] = shortMatch;
    return (
      parseInt(m) * 60 +
      parseInt(s) +
      parseInt(ms.substring(0, 3)) / 1000
    );
  }
  return null;
}

export function formatLapTime(seconds: number | null): string {
  if (seconds === null || isNaN(seconds)) return '—';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.round((seconds % 1) * 1000);
  return `${m}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
}

export function getPositionChange(
  startPos: number | null,
  endPos: number | null
): number | null {
  if (startPos === null || endPos === null) return null;
  return startPos - endPos; // positive = gained positions
}

export function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export const TYRE_ABBR: Record<string, string> = {
  SOFT: 'S',
  MEDIUM: 'M',
  HARD: 'H',
  INTERMEDIATE: 'I',
  WET: 'W',
  UNKNOWN: '?',
  TEST_UNKNOWN: '?',
};

export const COMPOUND_FULL_NAME: Record<string, string> = {
  SOFT: 'Soft',
  MEDIUM: 'Medium',
  HARD: 'Hard',
  INTERMEDIATE: 'Intermediate',
  WET: 'Wet',
  UNKNOWN: 'Unknown',
};
