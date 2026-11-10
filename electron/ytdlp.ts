import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import fs from 'fs';
import { app } from 'electron';
import axios from 'axios';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const userDataPath = app.getPath('userData');
const ytDlpFilename = process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp';
const ffmpegFilename = process.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg';

const ytDlpPath = path.join(userDataPath, ytDlpFilename);
const ffmpegPath = path.join(userDataPath, ffmpegFilename);

export const getFfmpegPath = (): string | null => {
  // 1. Check user data folder (if downloaded/copied there)
  if (fs.existsSync(ffmpegPath)) {
    return ffmpegPath;
  }
  // 2. Check packaged app.asar.unpacked
  try {
    const unpackedPath = path.join(
      process.resourcesPath,
      'app.asar.unpacked',
      'node_modules',
      'ffmpeg-static',
      ffmpegFilename
    );
    if (fs.existsSync(unpackedPath)) {
      return unpackedPath;
    }
  } catch {}
  // 3. Check development node_modules via app path
  try {
    const devPath = path.join(app.getAppPath(), 'node_modules', 'ffmpeg-static', ffmpegFilename);
    if (fs.existsSync(devPath)) {
      return devPath;
    }
  } catch {}
  // 4. Check cwd node_modules fallback
  try {
    const cwdPath = path.join(process.cwd(), 'node_modules', 'ffmpeg-static', ffmpegFilename);
    if (fs.existsSync(cwdPath)) {
      return cwdPath;
    }
  } catch {}
  return null;
};

export const getYtDlpVersion = (): Promise<string> => {
  return new Promise((resolve) => {
    if (!fs.existsSync(ytDlpPath)) {
      return resolve('Not installed');
    }
    const proc = spawn(ytDlpPath, ['--version']);
    let out = '';
    proc.stdout.on('data', (d) => {
      out += d.toString();
    });
    proc.on('close', (code) => {
      if (code === 0 && out.trim()) {
        resolve(out.trim());
      } else {
        resolve('Unknown');
      }
    });
    proc.on('error', () => {
      resolve('Unknown');
    });
  });
};

export const updateYtDlp = async (): Promise<{ success: boolean; message: string; version?: string }> => {
  try {
    const url =
      process.platform === 'win32'
        ? 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe'
        : process.platform === 'darwin'
        ? 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_macos'
        : 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp';

    const tempPath = `${ytDlpPath}.tmp`;
    const writer = fs.createWriteStream(tempPath);
    const response = await axios({
      url,
      method: 'GET',
      responseType: 'stream',
      timeout: 45000,
    });

    response.data.pipe(writer);

    await new Promise<void>((resolve, reject) => {
      writer.on('finish', () => resolve());
      writer.on('error', reject);
    });

    if (process.platform !== 'win32') {
      fs.chmodSync(tempPath, 0o755);
    }

    if (fs.existsSync(ytDlpPath)) {
      try {
        fs.unlinkSync(ytDlpPath);
      } catch {
        // Fallback for Windows if file is temporarily busy
        const backupPath = `${ytDlpPath}.old`;
        try {
          if (fs.existsSync(backupPath)) fs.unlinkSync(backupPath);
          fs.renameSync(ytDlpPath, backupPath);
        } catch {}
      }
    }
    fs.renameSync(tempPath, ytDlpPath);

    const version = await getYtDlpVersion();
    return { success: true, message: `yt-dlp updated to version ${version}`, version };
  } catch (err: any) {
    console.error('Failed to download/update yt-dlp:', err);
    return { success: false, message: err.message || 'Update failed' };
  }
};

export const ensureYtDlp = async (): Promise<boolean> => {
  if (!fs.existsSync(ytDlpPath)) {
    const res = await updateYtDlp();
    return res.success;
  }

  // Silently check and auto-update in background on launch
  updateYtDlp().catch((err) => console.warn('Background yt-dlp auto-update check:', err));
  return true;
};

export const formatErrorMessage = (rawError: string): string => {
  if (!rawError) return 'An unknown error occurred';
  const lines = rawError
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const errorLines = lines.filter((l) => l.startsWith('ERROR:'));
  if (errorLines.length > 0) {
    return errorLines.map((l) => l.replace(/^ERROR:\s*/, '')).join('; ');
  }

  const nonWarningLines = lines.filter((l) => !l.startsWith('WARNING:'));
  if (nonWarningLines.length > 0) {
    return nonWarningLines.join('; ');
  }

  return lines[0];
};

export interface ChapterInfo {
  title: string;
  startTime: number;
  endTime: number;
}

export interface DownloadSection {
  start: string;
  end: string;
  startSeconds?: number;
  endSeconds?: number;
  label?: string;
}

export interface FormatOption {
  formatId: string;
  label: string;
  ext: string;
  resolution: string;
  filesizeApprox?: string;
  isAudioOnly?: boolean;
}

export const analyzeVideo = (url: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(ytDlpPath)) {
      return reject(new Error('yt-dlp executable not found. Please wait for initial setup.'));
    }

    const proc = spawn(ytDlpPath, ['--dump-json', '--no-playlist', '--no-warnings', '--js-runtimes', 'node', url]);

    let output = '';
    let errorOutput = '';

    proc.stdout.on('data', (data) => {
      output += data.toString();
    });

    proc.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    proc.on('close', (code) => {
      if (code !== 0) {
        const cleanErr = formatErrorMessage(errorOutput);
        reject(new Error(cleanErr || 'Failed to analyze video URL'));
      } else {
        try {
          const raw = JSON.parse(output);

          // Extract format options with smart pre-merged stream fallback
          const hasFfmpeg = !!getFfmpegPath();

          const defaultBestFormat = hasFfmpeg
            ? 'bestvideo[vcodec^=avc]+bestaudio[acodec^=mp4a]/bestvideo[vcodec^=avc]+bestaudio/best[vcodec^=avc]/bestvideo+bestaudio/best'
            : 'best[ext=mp4]/best[vcodec!=none][acodec!=none]/18/22/best';

          const formats: FormatOption[] = [
            {
              formatId: defaultBestFormat,
              label: 'Best Quality (Premiere Pro Compatible)',
              ext: 'mp4',
              resolution: raw.height ? `${raw.height}p` : 'Best',
            },
          ];

          if (raw.formats && Array.isArray(raw.formats)) {
            // Find distinct heights like 1080, 720, 480, 360
            const heightsSeen = new Set<number>();
            const videoFormats = raw.formats.filter(
              (f: any) => f.vcodec !== 'none' && f.height && f.height >= 360
            );

            // Sort by height descending
            videoFormats.sort((a: any, b: any) => b.height - a.height);

            for (const vf of videoFormats) {
              if (!heightsSeen.has(vf.height)) {
                heightsSeen.add(vf.height);

                const formatString = hasFfmpeg
                  ? `bestvideo[height<=${vf.height}][vcodec^=avc]+bestaudio[acodec^=mp4a]/bestvideo[height<=${vf.height}][vcodec^=avc]+bestaudio/bestvideo[height<=${vf.height}]+bestaudio/best[height<=${vf.height}]`
                  : `best[height<=${vf.height}]/18/best`;

                formats.push({
                  formatId: formatString,
                  label: `${vf.height}p ${vf.height >= 720 ? 'HD' : 'SD'}`,
                  ext: 'mp4',
                  resolution: `${vf.height}p`,
                });
              }
            }
          }

          // Audio option
          formats.push({
            formatId: 'bestaudio/best',
            label: 'Audio Only (MP3 / M4A)',
            ext: 'mp3',
            resolution: 'Audio',
            isAudioOnly: true,
          });

          resolve({
            id: raw.id,
            title: raw.title,
            uploader: raw.uploader || raw.channel || 'Unknown Uploader',
            upload_date: raw.upload_date,
            duration: raw.duration || 0,
            thumbnail: raw.thumbnail || (raw.thumbnails && raw.thumbnails[0]?.url) || '',
            view_count: raw.view_count,
            like_count: raw.like_count,
            webpage_url: raw.webpage_url || url,
            formats,
            chapters: Array.isArray(raw.chapters)
              ? raw.chapters.map((ch: any) => ({
                  title: ch.title,
                  startTime: ch.start_time,
                  endTime: ch.end_time,
                }))
              : [],
          });
        } catch (e) {
          reject(new Error('Failed to parse video details from yt-dlp response.'));
        }
      }
    });
  });
};

export const startDownload = (
  url: string,
  downloadPath: string,
  format: string,
  onProgress: (data: { progress: number; size: string; speed: string; eta: string }) => void,
  onComplete: (filePath: string) => void,
  onError: (error: string) => void,
  section?: DownloadSection
): ChildProcess => {
  if (!fs.existsSync(ytDlpPath)) {
    throw new Error('yt-dlp executable not found');
  }

  let outputTemplate = path.join(downloadPath, '%(title)s [%(id)s].%(ext)s');
  if (section && section.start && section.end) {
    const cleanStart = section.start.replace(/:/g, '.');
    const cleanEnd = section.end.replace(/:/g, '.');
    outputTemplate = path.join(downloadPath, `%(title)s [clip ${cleanStart}-${cleanEnd}] [%(id)s].%(ext)s`);
  }

  const args = [
    url,
    '-f',
    format || 'best[ext=mp4]/best[vcodec!=none][acodec!=none]/18/best',
    '-o',
    outputTemplate,
    '--no-warnings',
    '--js-runtimes', 'node',
    '--newline',
    '--no-mtime',
    '--no-part',
    '--print',
    'after_move:filepath',
  ];

  if (section && section.start && section.end) {
    args.push('--download-sections', `*${section.start}-${section.end}`);
    args.push('--force-keyframes-at-cuts');
  }

  const resolvedFfmpeg = getFfmpegPath();
  if (resolvedFfmpeg) {
    args.push('--ffmpeg-location', resolvedFfmpeg);
    const isAudioOnly = format.includes('bestaudio') || format.includes('ba/');
    if (!isAudioOnly) {
      // Force transcode to H.264 + AAC — Premiere Pro natively supports this.
      args.push('--recode-video', 'mp4');
      args.push('--postprocessor-args', 'ffmpeg:-c:v libx264 -crf 18 -preset slow -c:a aac -b:a 320k');
    }
  }

  const proc = spawn(ytDlpPath, args);

  let finalFilePath = '';
  let errorOutput = '';

  proc.stdout.on('data', (data) => {
    const text = data.toString();

    // Check for printable final filepath output
    const lines = text.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && fs.existsSync(trimmed)) {
        finalFilePath = trimmed;
      }
    }

    // Match progress patterns
    const percentMatch = text.match(/\[download\]\s+([\d.]+)%/);
    const sizeMatch = text.match(/of\s+~?([\d.]+\s*[a-zA-Z]+)/);
    const speedMatch = text.match(/at\s+([\d.]+\s*[a-zA-Z]+\/s)/);
    const etaMatch = text.match(/ETA\s+([\d:]+)/);

    if (percentMatch) {
      onProgress({
        progress: Math.min(100, parseFloat(percentMatch[1])),
        size: sizeMatch ? sizeMatch[1].trim() : 'Downloading...',
        speed: speedMatch ? speedMatch[1].trim() : '--',
        eta: etaMatch ? etaMatch[1].trim() : '--',
      });
    }
  });

  proc.stderr.on('data', (data) => {
    const msg = data.toString();
    if (!msg.includes('[download]')) {
      errorOutput += msg;
    }
  });

  proc.on('close', (code) => {
    if (code === 0) {
      onProgress({ progress: 100, size: 'Done', speed: '0 B/s', eta: '00:00' });
      onComplete(finalFilePath || downloadPath);
    } else {
      const cleanErr = formatErrorMessage(errorOutput);
      onError(cleanErr || `Download process exited with code ${code}`);
    }
  });

  return proc;
};
