const fs = require('fs');
const path = require('path');

// Simple PNG generator with a sleek cyber shield icon using raw PNG buffer creation or SVG
const iconsDir = path.join(__dirname, 'chrome-extension', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// We can create SVG icons and also minimal valid PNGs so Chrome loads instantly without external deps
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0f172a;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#1e293b;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="neon" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#10b981;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#06b6d4;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="128" height="128" rx="28" fill="url(#grad)" stroke="#334155" stroke-width="3"/>
  <path d="M64 16 L104 34 V66 C104 94 64 112 64 112 C64 112 24 94 24 66 V34 L64 16 Z" fill="none" stroke="url(#neon)" stroke-width="8" stroke-linejoin="round"/>
  <path d="M48 64 L58 74 L80 50" fill="none" stroke="#10b981" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

fs.writeFileSync(path.join(iconsDir, 'icon.svg'), svgContent);

// A valid 1x1 or minimal PNG fallback buffer if required by Chrome, plus SVG
// Let's create proper PNG files using a simple uncompressed PNG writer
function createMinimalPng(size) {
  // Simple uncompressed 32-bit RGBA PNG writer
  const width = size;
  const height = size;
  
  // Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  
  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData.writeUInt8(8, 8);  // 8 bits per channel
  ihdrData.writeUInt8(6, 9);  // RGBA
  ihdrData.writeUInt8(0, 10); // Compression method
  ihdrData.writeUInt8(0, 11); // Filter method
  ihdrData.writeUInt8(0, 12); // Interlace method
  
  // IDAT chunk (uncompressed zlib block)
  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(height * rowSize);
  for (let y = 0; y < height; y++) {
    const rowStart = y * rowSize;
    rawData[rowStart] = 0; // Filter: None
    for (let x = 0; x < width; x++) {
      const pxStart = rowStart + 1 + x * 4;
      // Draw cyber dark slate background with emerald green shield outline/center
      const dx = x - width / 2;
      const dy = y - height / 2;
      const dist = Math.sqrt(dx*dx + dy*dy);
      
      if (dist < size * 0.45) {
        // Center / shield area
        rawData[pxStart] = 16;     // R (#10)
        rawData[pxStart + 1] = 185; // G (#b9)
        rawData[pxStart + 2] = 129; // B (#81)
        rawData[pxStart + 3] = 255; // A
      } else {
        // Dark slate border/bg
        rawData[pxStart] = 15;      // R (#0f)
        rawData[pxStart + 1] = 23;  // G (#17)
        rawData[pxStart + 2] = 42;  // B (#2a)
        rawData[pxStart + 3] = 255; // A
      }
    }
  }
  
  const zlibHeader = Buffer.from([0x78, 0x01]);
  // Deflate uncompressed blocks
  const blocks = [];
  let offset = 0;
  while (offset < rawData.length) {
    const chunkLen = Math.min(rawData.length - offset, 65535);
    const isLast = (offset + chunkLen === rawData.length) ? 1 : 0;
    const blockHeader = Buffer.alloc(5);
    blockHeader.writeUInt8(isLast, 0);
    blockHeader.writeUInt16LE(chunkLen, 1);
    blockHeader.writeUInt16LE(~chunkLen & 0xffff, 3);
    blocks.push(blockHeader);
    blocks.push(rawData.slice(offset, offset + chunkLen));
    offset += chunkLen;
  }
  
  // Adler32 checksum
  let s1 = 1, s2 = 0;
  for (let i = 0; i < rawData.length; i++) {
    s1 = (s1 + rawData[i]) % 65521;
    s2 = (s2 + s1) % 65521;
  }
  const adler = Buffer.alloc(4);
  adler.writeUInt32BE((s2 << 16) | s1, 0);
  
  const zlibData = Buffer.concat([zlibHeader, ...blocks, adler]);
  
  function makeChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeAndData = Buffer.concat([Buffer.from(type), data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(typeAndData), 0);
    return Buffer.concat([len, typeAndData, crc]);
  }
  
  function crc32(buf) {
    let crc = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      crc = crc ^ buf[i];
      for (let j = 0; j < 8; j++) {
        crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
      }
    }
    return crc ^ 0xffffffff;
  }
  
  const ihdrChunk = makeChunk('IHDR', ihdrData);
  const idatChunk = makeChunk('IDAT', zlibData);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));
  
  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

fs.writeFileSync(path.join(iconsDir, 'icon16.png'), createMinimalPng(16));
fs.writeFileSync(path.join(iconsDir, 'icon48.png'), createMinimalPng(48));
fs.writeFileSync(path.join(iconsDir, 'icon128.png'), createMinimalPng(128));
console.log('Icons generated successfully.');
