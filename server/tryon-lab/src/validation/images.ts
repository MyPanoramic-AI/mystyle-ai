import { createHash } from 'node:crypto';
import { LabError } from '../errors.js';
import { LOCAL_IMAGE_MAX_BYTES } from '../config.js';
import type { ImageFacts, ImageFormat } from '../types.js';

const MIN_EDGE = 15;
const MAX_EDGE = 8192;
const MIN_ASPECT = 1 / 16;
const MAX_ASPECT = 16;

export function decodeImagePayload(input: string): Buffer {
  const trimmed = input.trim();
  if (!trimmed) {
    throw new LabError('empty_image', 'The image payload is empty.', 400);
  }
  const dataUri = /^data:[^;,]+;base64,([a-z0-9+/=\r\n]+)$/i.exec(trimmed);
  const encoded = (dataUri ? dataUri[1] : trimmed).replace(/\s/g, '');
  if (!/^[a-z0-9+/=]+$/i.test(encoded)) {
    throw new LabError('unreadable_image', 'The image payload is not valid base64.', 400);
  }
  return Buffer.from(encoded, 'base64');
}

export function inspectImage(bytes: Buffer, maxBytes = LOCAL_IMAGE_MAX_BYTES): ImageFacts {
  if (bytes.length === 0) {
    throw new LabError('empty_image', 'The image file is empty.', 400);
  }
  if (bytes.length > maxBytes) {
    throw new LabError(
      'image_too_large',
      `The image is ${bytes.length} bytes. This lab accepts at most ${maxBytes} bytes per image.`,
      400,
    );
  }
  const parsed = parseImage(bytes);
  if (!parsed) {
    throw new LabError(
      'unsupported_format',
      'The file is not a readable JPEG, PNG, or WebP image. The filename and browser type were not used.',
      400,
    );
  }
  if (parsed.width < MIN_EDGE || parsed.height < MIN_EDGE) {
    throw new LabError(
      'image_too_small',
      `The image is ${parsed.width}×${parsed.height}. Both edges must be at least ${MIN_EDGE} pixels.`,
      400,
    );
  }
  if (parsed.width > MAX_EDGE || parsed.height > MAX_EDGE) {
    throw new LabError(
      'image_too_large',
      `The image is ${parsed.width}×${parsed.height}. Neither edge may exceed ${MAX_EDGE} pixels.`,
      400,
    );
  }
  const aspect = parsed.width / parsed.height;
  if (aspect < MIN_ASPECT || aspect > MAX_ASPECT) {
    throw new LabError(
      'extreme_aspect_ratio',
      `The image aspect ratio ${aspect.toFixed(3)} is outside 1:16 to 16:1.`,
      400,
    );
  }
  return {
    ...parsed,
    byteSize: bytes.length,
    sha256: createHash('sha256').update(bytes).digest('hex'),
  };
}

export function suitabilityWarnings(facts: ImageFacts): string[] {
  const warnings: string[] = [];
  const shortSide = Math.min(facts.width, facts.height);
  if (shortSide < 512) {
    warnings.push(
      `The shorter side is ${shortSide} pixels. Fine garment detail may not survive generation. This check does not measure body size or garment fit.`,
    );
  }
  return warnings;
}

function parseImage(bytes: Buffer): { format: ImageFormat; width: number; height: number } | null {
  if (isPng(bytes)) {
    const size = pngSize(bytes);
    return size ? { format: 'png', ...size } : null;
  }
  if (isJpeg(bytes)) {
    const size = jpegSize(bytes);
    return size ? { format: 'jpeg', ...size } : null;
  }
  if (isWebp(bytes)) {
    const size = webpSize(bytes);
    return size ? { format: 'webp', ...size } : null;
  }
  return null;
}

function isPng(bytes: Buffer): boolean {
  return bytes.length > 24 && bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
}

function pngSize(bytes: Buffer): { width: number; height: number } | null {
  if (bytes.toString('ascii', 12, 16) !== 'IHDR') return null;
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

function isJpeg(bytes: Buffer): boolean {
  return bytes.length > 4 && bytes[0] === 0xff && bytes[1] === 0xd8;
}

function jpegSize(bytes: Buffer): { width: number; height: number } | null {
  let offset = 2;
  while (offset + 8 < bytes.length) {
    if (bytes[offset] !== 0xff) return null;
    const marker = bytes[offset + 1];
    if (marker === 0xd8 || marker === 0xd9) {
      offset += 2;
      continue;
    }
    if (offset + 4 > bytes.length) return null;
    const length = bytes.readUInt16BE(offset + 2);
    if (length < 2 || offset + 2 + length > bytes.length) return null;
    const isSof = marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc;
    if (isSof) {
      return { height: bytes.readUInt16BE(offset + 5), width: bytes.readUInt16BE(offset + 7) };
    }
    offset += 2 + length;
  }
  return null;
}

function isWebp(bytes: Buffer): boolean {
  return bytes.length > 16 && bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP';
}

function webpSize(bytes: Buffer): { width: number; height: number } | null {
  const chunk = bytes.toString('ascii', 12, 16);
  if (chunk === 'VP8X' && bytes.length >= 30) {
    const width = 1 + bytes.readUIntLE(24, 3);
    const height = 1 + bytes.readUIntLE(27, 3);
    return { width, height };
  }
  if (chunk === 'VP8 ' && bytes.length >= 30) {
    const start = 23;
    if (bytes[start] !== 0x9d || bytes[start + 1] !== 0x01 || bytes[start + 2] !== 0x2a) return null;
    return {
      width: bytes.readUInt16LE(start + 3) & 0x3fff,
      height: bytes.readUInt16LE(start + 5) & 0x3fff,
    };
  }
  if (chunk === 'VP8L' && bytes.length >= 25) {
    const b0 = bytes[21];
    const b1 = bytes[22];
    const b2 = bytes[23];
    const b3 = bytes[24];
    return {
      width: 1 + (((b1 & 0x3f) << 8) | b0),
      height: 1 + (((b3 & 0x0f) << 10) | (b2 << 2) | ((b1 & 0xc0) >> 6)),
    };
  }
  return null;
}
