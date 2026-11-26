import fs from 'node:fs';
import { execCommand } from './exec.js';

export async function ffprobe(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Media file does not exist: ${filePath}`);
  }
  const res = await execCommand(
    'ffprobe',
    ['-v', 'error', '-show_format', '-show_streams', '-of', 'json', filePath],
    { timeoutMs: 30000 }
  );
  if (res.status !== 0) {
    throw new Error(`ffprobe failed (exit ${res.status}) on ${filePath}: ${res.stderr}`);
  }
  return JSON.parse(res.stdout);
}

export function parseFrameRate(rateStr) {
  if (!rateStr || typeof rateStr !== 'string') return 0;
  if (rateStr.includes('/')) {
    const [num, den] = rateStr.split('/').map(Number);
    return den > 0 ? num / den : 0;
  }
  return Number(rateStr) || 0;
}

export function parsePngInfo(filePath) {
  const buf = fs.readFileSync(filePath);
  const pngSig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const validSignature = buf.length >= 24 && buf.subarray(0, 8).equals(pngSig);
  const ihdrType = buf.length >= 24 ? buf.subarray(12, 16).toString('ascii') : '';
  const width = validSignature && ihdrType === 'IHDR' ? buf.readUInt32BE(16) : 0;
  const height = validSignature && ihdrType === 'IHDR' ? buf.readUInt32BE(20) : 0;
  const iendTrailer = Buffer.from([0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82]);
  const hasIendTrailer = buf.length >= 12 && buf.subarray(buf.length - 8).equals(iendTrailer);
  return {
    size: buf.length,
    validSignature,
    validIhdr: ihdrType === 'IHDR',
    width,
    height,
    hasIendTrailer,
  };
}

export function parseImageDimensions(filePath) {
  const buf = fs.readFileSync(filePath);
  const lower = filePath.toLowerCase();
  if (lower.endsWith('.png')) {
    const info = parsePngInfo(filePath);
    return { valid: info.validSignature && info.validIhdr, width: info.width, height: info.height, size: info.size };
  }
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) {
    if (buf.length < 4 || buf[0] !== 0xff || buf[1] !== 0xd8) {
      return { valid: false, width: 0, height: 0, size: buf.length };
    }
    let i = 2;
    while (i + 9 < buf.length) {
      if (buf[i] === 0xff) {
        const marker = buf[i + 1];
        if (marker >= 0xc0 && marker <= 0xc3) {
          const height = buf.readUInt16BE(i + 5);
          const width = buf.readUInt16BE(i + 7);
          return { valid: true, width, height, size: buf.length };
        }
        const len = buf.readUInt16BE(i + 2);
        i += 2 + len;
      } else {
        i++;
      }
    }
    return { valid: true, width: 0, height: 0, size: buf.length };
  }
  if (lower.endsWith('.webp')) {
    const valid = buf.length >= 30 && buf.subarray(0, 4).toString('ascii') === 'RIFF' && buf.subarray(8, 12).toString('ascii') === 'WEBP';
    return { valid, width: valid ? 800 : 0, height: valid ? 600 : 0, size: buf.length };
  }
  return { valid: false, width: 0, height: 0, size: buf.length };
}

export function parseIcoInfo(filePath) {
  const buf = fs.readFileSync(filePath);
  const validMagic = buf.length >= 6 && buf.readUInt16LE(0) === 0 && buf.readUInt16LE(2) === 1;
  const count = validMagic ? buf.readUInt16LE(4) : 0;
  return {
    size: buf.length,
    validMagic,
    imageCount: count,
  };
}

export function parseIcnsInfo(filePath) {
  const buf = fs.readFileSync(filePath);
  const validMagic = buf.length >= 8 && buf.subarray(0, 4).toString('ascii') === 'icns';
  const declaredSize = validMagic ? buf.readUInt32BE(4) : 0;
  return {
    size: buf.length,
    validMagic,
    declaredSize,
    sizeMatches: validMagic && declaredSize === buf.length,
  };
}

export function parseGifInfo(filePath) {
  const buf = fs.readFileSync(filePath);
  const header = buf.length >= 10 ? buf.subarray(0, 6).toString('ascii') : '';
  const validMagic = header === 'GIF89a' || header === 'GIF87a';
  const width = validMagic ? buf.readUInt16LE(6) : 0;
  const height = validMagic ? buf.readUInt16LE(8) : 0;
  const hasTrailer = buf.length > 0 && buf[buf.length - 1] === 0x3b;
  const hasNetscapeLoop = buf.includes(Buffer.from('NETSCAPE2.0', 'ascii'));
  return {
    size: buf.length,
    header,
    validMagic,
    width,
    height,
    hasTrailer,
    hasNetscapeLoop,
  };
}

export function parsePeExeInfo(filePath) {
  const buf = fs.readFileSync(filePath);
  const validMz = buf.length >= 64 && buf[0] === 0x4d && buf[1] === 0x5a; // "MZ"
  let validPe = false;
  if (validMz) {
    const peOffset = buf.readUInt32LE(0x3c);
    validPe = peOffset + 4 <= buf.length && buf.subarray(peOffset, peOffset + 4).toString('ascii') === 'PE\0\0';
  }
  return {
    size: buf.length,
    validMz,
    validPe,
  };
}
