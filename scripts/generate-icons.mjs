// Generates PWA icons (solid background + checkmark) without image deps.
// Run: node scripts/generate-icons.mjs
import { deflateSync } from 'node:zlib'
import { writeFileSync } from 'node:fs'

const BG = [15, 23, 42] // #0f172a slate-900
const CIRCLE = [99, 102, 241] // #6366f1 indigo-500
const CHECK = [255, 255, 255]

function crc32(buf) {
  let c
  const table = []
  for (let n = 0; n < 256; n++) {
    c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    table[n] = c
  }
  let crc = 0xffffffff
  for (const b of buf) crc = table[(crc ^ b) & 0xff] ^ (crc >>> 8)
  return (crc ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const body = Buffer.concat([Buffer.from(type), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body))
  return Buffer.concat([len, body, crc])
}

function distToSegment(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1
  const dy = y2 - y1
  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy)))
  const cx = x1 + t * dx
  const cy = y1 + t * dy
  return Math.hypot(px - cx, py - cy)
}

function makePng(size) {
  const cx = size / 2
  const cy = size / 2
  const r = size * 0.36
  const t = size * 0.05
  // checkmark segment endpoints in unit coords
  const seg1 = [0.36, 0.51, 0.46, 0.62]
  const seg2 = [0.46, 0.62, 0.66, 0.39]
  const raw = Buffer.alloc(size * (1 + size * 4))
  for (let y = 0; y < size; y++) {
    const row = y * (1 + size * 4)
    raw[row] = 0 // filter: none
    for (let x = 0; x < size; x++) {
      let px = BG
      if (Math.hypot(x - cx, y - cy) <= r) px = CIRCLE
      const d1 = distToSegment(x, y, seg1[0] * size, seg1[1] * size, seg1[2] * size, seg1[3] * size)
      const d2 = distToSegment(x, y, seg2[0] * size, seg2[1] * size, seg2[2] * size, seg2[3] * size)
      if (Math.min(d1, d2) <= t) px = CHECK
      const o = row + 1 + x * 4
      raw[o] = px[0]
      raw[o + 1] = px[1]
      raw[o + 2] = px[2]
      raw[o + 3] = 255
    }
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

writeFileSync('public/pwa-192x192.png', makePng(192))
writeFileSync('public/pwa-512x512.png', makePng(512))
writeFileSync('public/apple-touch-icon.png', makePng(180))
console.log('icons written')
