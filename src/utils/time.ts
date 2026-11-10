export interface DownloadSection {
  start: string;
  end: string;
  startSeconds?: number;
  endSeconds?: number;
  label?: string;
}

/**
 * Format seconds into human readable time (e.g. 01:25:30 or 14:20)
 */
export const formatSecondsToTime = (seconds: number): string => {
  if (!seconds || isNaN(seconds) || seconds < 0) return '00:00';
  const s = Math.floor(seconds);
  const hrs = Math.floor(s / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const secs = s % 60;

  const pad = (n: number) => n.toString().padStart(2, '0');
  if (hrs > 0) {
    return `${hrs}:${pad(mins)}:${pad(secs)}`;
  }
  return `${pad(mins)}:${pad(secs)}`;
};

/**
 * Format seconds into standardized timestamp for yt-dlp (hh:mm:ss)
 */
export const secondsToYtDlpTime = (seconds: number): string => {
  const s = Math.max(0, Math.floor(seconds || 0));
  const hrs = Math.floor(s / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const secs = s % 60;

  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
};

/**
 * Format duration into friendly text (e.g. "12m 30s" or "1h 15m")
 */
export const formatDurationHuman = (seconds: number): string => {
  if (!seconds || isNaN(seconds) || seconds < 0) return '0s';
  const s = Math.floor(seconds);
  const hrs = Math.floor(s / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const secs = s % 60;

  if (hrs > 0) {
    return `${hrs}h ${mins}m ${secs > 0 ? `${secs}s` : ''}`.trim();
  }
  if (mins > 0) {
    return `${mins}m ${secs > 0 ? `${secs}s` : ''}`.trim();
  }
  return `${secs}s`;
};

/**
 * Parse time string (e.g. "14:30", "01:20:15", "45", "15m") into seconds
 */
export const parseTimeStringToSeconds = (input: string): number | null => {
  if (!input) return null;
  const trimmed = input.trim();

  // Handle format like 1h20m30s or 15m30s
  if (/(\d+h)?\s*(\d+m)?\s*(\d+s)?/i.test(trimmed) && /[hms]/i.test(trimmed)) {
    let total = 0;
    const h = trimmed.match(/(\d+)\s*h/i);
    const m = trimmed.match(/(\d+)\s*m/i);
    const s = trimmed.match(/(\d+)\s*s/i);
    if (h) total += parseInt(h[1], 10) * 3600;
    if (m) total += parseInt(m[1], 10) * 60;
    if (s) total += parseInt(s[1], 10);
    return total;
  }

  // Handle colon format: hh:mm:ss or mm:ss
  if (trimmed.includes(':')) {
    const parts = trimmed.split(':').map((p) => parseInt(p, 10));
    if (parts.some((p) => isNaN(p))) return null;

    if (parts.length === 3) {
      const [h, m, s] = parts;
      return h * 3600 + m * 60 + s;
    }
    if (parts.length === 2) {
      const [m, s] = parts;
      return m * 60 + s;
    }
  }

  // Plain number of minutes or seconds
  const num = parseFloat(trimmed);
  if (!isNaN(num) && num >= 0) {
    return Math.floor(num);
  }

  return null;
};

/**
 * Extract timestamp parameter from YouTube URL (e.g. ?t=120 or &t=14m30s)
 */
export const extractTimestampFromUrl = (url: string): number | null => {
  try {
    const urlObj = new URL(url);
    const tParam = urlObj.searchParams.get('t');
    if (!tParam) return null;

    if (/^\d+s?$/.test(tParam)) {
      return parseInt(tParam.replace('s', ''), 10);
    }

    let total = 0;
    const h = tParam.match(/(\d+)h/);
    const m = tParam.match(/(\d+)m/);
    const s = tParam.match(/(\d+)s/);
    if (h) total += parseInt(h[1], 10) * 3600;
    if (m) total += parseInt(m[1], 10) * 60;
    if (s) total += parseInt(s[1], 10);

    return total > 0 ? total : null;
  } catch {
    return null;
  }
};

