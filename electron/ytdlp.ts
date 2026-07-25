import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import fs from 'fs';
import { app } from 'electron';
import axios from 'axios';

const userDataPath = app.getPath('userData');
const ytDlpFilename = process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp';
const ffmpegFilename = process.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg';

const ytDlpPath = path.join(userDataPath, ytDlpFilename);
const ffmpegPath = path.join(userDataPath, ffmpegFilename);

export const ensureYtDlp = async (): Promise<boolean> => {
  if (fs.existsSync(ytDlpPath)) return true;

  try {
    const url =
      process.platform === 'win32'
        ? 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe'
        : process.platform === 'darwin'
        ? 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_macos'
        : 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp';

    const writer = fs.createWriteStream(ytDlpPath);
    const response = await axios({
      url,
      method: 'GET',
      responseType: 'stream',
    });

    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on('finish', () => {
        if (process.platform !== 'win32') {
          fs.chmodSync(ytDlpPath, 0o755);
        }
        resolve(true);
      });
      writer.on('error', reject);
    });
  } catch (err) {
    console.error('Failed to download yt-dlp:', err);
    return false;
  }
};

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

    const proc = spawn(ytDlpPath, ['--dump-json', '--no-playlist', url]);

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
        reject(new Error(`yt-dlp error: ${errorOutput || 'Failed to analyze video URL'}`));
      } else {
        try {
          const raw = JSON.parse(output);

          // Extract format options with smart pre-merged stream fallback
          const hasFfmpeg = fs.existsSync(ffmpegPath);

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
  onError: (error: string) => void
): ChildProcess => {
  if (!fs.existsSync(ytDlpPath)) {
    throw new Error('yt-dlp executable not found');
  }

  const outputTemplate = path.join(downloadPath, '%(title)s [%(id)s].%(ext)s');
  const args = [
    url,
    '-f',
    format || 'best[ext=mp4]/best[vcodec!=none][acodec!=none]/18/best',
    '-o',
    outputTemplate,
    '--newline',
    '--no-mtime',
    '--no-part',
    '--print',
    'after_move:filepath',
  ];

  if (fs.existsSync(ffmpegPath)) {
    args.push('--ffmpeg-location', ffmpegPath);
    // Force transcode to H.264 + AAC — the only codecs Adobe Premiere Pro natively supports.
    // --recode-video will re-encode if the stream is VP9/AV1, not just remux.
    args.push('--recode-video', 'mp4');
    args.push('--postprocessor-args', 'ffmpeg:-c:v libx264 -crf 18 -preset slow -c:a aac -b:a 320k');
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
    const percentMatch = text.match(/\[download\]\s+([\d\.]+)%/);
    const sizeMatch = text.match(/of\s+~?([\d\.]+\s*[a-zA-Z]+)/);
    const speedMatch = text.match(/at\s+([\d\.]+\s*[a-zA-Z]+\/s)/);
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
      onError(errorOutput || `Download process exited with code ${code}`);
    }
  });

  return proc;
};
