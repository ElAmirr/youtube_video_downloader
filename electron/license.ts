import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import fs from 'fs';
import os from 'os';
import crypto from 'crypto';
import { execSync } from 'child_process';

const LICENSE_SERVER = 'https://photo-invoice-licence-sever.onrender.com';
const ENCRYPTION_ALGORITHM = 'aes-256-cbc';
const ENCRYPTION_KEY_SALT = 'vidos_secure_salt_2026';
const APP_IDENTIFIER = 'youtube_video_downloader';

/**
 * Robust Hardware ID (HWID) generator (Matches Windows MachineGuid, Mac IOPlatformUUID, Linux machine-id)
 */
export function getMachineId(): string {
  try {
    if (process.platform === 'win32') {
      const output = execSync('reg query "HKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft\\Cryptography" /v MachineGuid', {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      });
      const match = output.match(/REG_SZ\s+([a-zA-Z0-9_-]+)/);
      if (match && match[1]) {
        return match[1].trim();
      }
    } else if (process.platform === 'darwin') {
      const output = execSync('ioreg -rd1 -c IOPlatformExpertDevice', {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      });
      const match = output.match(/"IOPlatformUUID"\s*=\s*"([^"]+)"/);
      if (match && match[1]) {
        return match[1].trim();
      }
    } else {
      if (fs.existsSync('/etc/machine-id')) {
        return fs.readFileSync('/etc/machine-id', 'utf8').trim();
      }
      if (fs.existsSync('/var/lib/dbus/machine-id')) {
        return fs.readFileSync('/var/lib/dbus/machine-id', 'utf8').trim();
      }
    }
  } catch (e) {
    // Fallback if registry or command blocked
  }

  // Network & Host fallback
  const network = Object.values(os.networkInterfaces())
    .flat()
    .filter(Boolean)
    .map((i) => i?.mac)
    .filter((mac) => mac && mac !== '00:00:00:00:00:00')
    .sort()
    .join('-');

  return crypto.createHash('sha256').update(os.hostname() + network).digest('hex');
}

function getEncryptionKey(): Buffer {
  const hwid = getMachineId();
  return crypto.createHash('sha256').update(hwid + ENCRYPTION_KEY_SALT).digest();
}

function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, getEncryptionKey(), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decrypt(text: string): string | null {
  try {
    const textParts = text.split(':');
    const iv = Buffer.from(textParts.shift()!, 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    const decipher = crypto.createDecipheriv(ENCRYPTION_ALGORITHM, getEncryptionKey(), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  } catch (e) {
    return null;
  }
}

export function getLicensePath(): string {
  const userDataPath = app.getPath('userData');
  if (!fs.existsSync(userDataPath)) {
    fs.mkdirSync(userDataPath, { recursive: true });
  }
  return path.join(userDataPath, 'license.lic');
}

export function checkLicense(): any {
  const p = getLicensePath();
  if (fs.existsSync(p)) {
    try {
      const encryptedData = fs.readFileSync(p, 'utf8');
      const decryptedData = decrypt(encryptedData);
      if (!decryptedData) return { activated: false };

      const data = JSON.parse(decryptedData);
      const currentHwid = getMachineId();

      // Verify HWID matches (prevents copying license file to other machines)
      if (data.hwid !== currentHwid) {
        console.warn('License HWID mismatch!');
        return { activated: false };
      }

      // Check client-side expiration if set
      if (data.expiresAt && new Date() > new Date(data.expiresAt)) {
        return { activated: false, expired: true, key: data.key, expiresAt: data.expiresAt };
      }

      return data;
    } catch (err) {
      console.error('Error reading license:', err);
      return { activated: false };
    }
  }
  return { activated: false };
}

export function saveLicense(licenseData: any): boolean {
  try {
    const encrypted = encrypt(JSON.stringify(licenseData));
    fs.writeFileSync(getLicensePath(), encrypted);
    return true;
  } catch (err) {
    console.error('Error saving license:', err);
    return false;
  }
}

export function deleteLicense(): boolean {
  try {
    const p = getLicensePath();
    if (fs.existsSync(p)) fs.unlinkSync(p);
    return true;
  } catch (err) {
    return false;
  }
}

/**
 * Setup license IPC handlers and 5-minute background heartbeat
 */
export function setupLicenseHandlers(getMainWindow: () => BrowserWindow | null) {
  ipcMain.handle('get-hwid', () => {
    return getMachineId();
  });

  ipcMain.handle('get-app-info', () => {
    return {
      version: app.getVersion(),
      os: `${process.platform} ${os.release()}`,
      app: APP_IDENTIFIER,
    };
  });

  ipcMain.handle('check-license', () => {
    return checkLicense();
  });

  ipcMain.handle('save-license', (_event, licenseData) => {
    return saveLicense(licenseData);
  });

  ipcMain.handle('delete-license', () => {
    return deleteLicense();
  });

  ipcMain.handle('start-trial', async () => {
    try {
      const hwid = getMachineId();
      const response = await fetch(`${LICENSE_SERVER}/api/trials/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hwid,
          app: APP_IDENTIFIER,
          version: app.getVersion(),
          os: `${process.platform} ${os.release()}`,
        }),
      });
      return await response.json();
    } catch (err: any) {
      console.error('Start Trial Error:', err);
      return { success: false, message: 'Connection error' };
    }
  });

  // Background Heartbeat Logic
  const performHeartbeat = async () => {
    const p = getLicensePath();
    if (fs.existsSync(p)) {
      try {
        const encryptedData = fs.readFileSync(p, 'utf8');
        const decryptedData = decrypt(encryptedData);
        if (!decryptedData) return;
        const data = JSON.parse(decryptedData);

        if (data.activated && data.key) {
          try {
            const response = await fetch(`${LICENSE_SERVER}/api/activate`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                key: data.key,
                hwid: data.hwid,
                app: APP_IDENTIFIER,
                version: app.getVersion(),
                os: `${process.platform} ${os.release()}`,
              }),
            });

            const mainWindow = getMainWindow();

            // Handle explicit revocation (404/403)
            if (response.status === 404 || response.status === 403) {
              console.log(`Heartbeat: License revoked (Status ${response.status}). Locking app...`);
              deleteLicense();
              if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.webContents.send('license-revoked');
              }
              return;
            }

            const result = await response.json();
            if (result && result.success === false) {
              console.log('Heartbeat: License revoked (JSON). Locking app...');
              deleteLicense();
              if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.webContents.send('license-revoked');
              }
            } else if (result && result.success) {
              // Update local expiration date if refreshed
              const expiryDate = result.expiresAt || result.expires_at || data.expiresAt || null;
              saveLicense({
                ...data,
                expiresAt: expiryDate,
                lastChecked: new Date().toISOString(),
              });
            }
          } catch (err: any) {
            console.error('Heartbeat ping failed (Networking):', err.message);
          }
        }
      } catch (err) {
        console.error('Heartbeat check error:', err);
      }
    }
  };

  // Run on startup
  performHeartbeat();

  // Repeat every 5 minutes
  setInterval(performHeartbeat, 5 * 60 * 1000);
}

