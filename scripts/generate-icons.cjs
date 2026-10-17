const { app, BrowserWindow, nativeImage } = require("electron");
const fs = require("fs");
const path = require("path");

const SVG_CONTENT = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <!-- Background squircle gradient -->
    <linearGradient id="bgGrad" x1="0" y1="0" x2="512" y2="512" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#1e1b4b" />
      <stop offset="50%" stop-color="#0f111a" />
      <stop offset="100%" stop-color="#090a10" />
    </linearGradient>

    <!-- Border glow gradient -->
    <linearGradient id="borderGrad" x1="0" y1="0" x2="512" y2="512" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#f59e0b" stop-opacity="0.9" />
      <stop offset="50%" stop-color="#818cf8" stop-opacity="0.5" />
      <stop offset="100%" stop-color="#d97706" stop-opacity="0.9" />
    </linearGradient>

    <!-- Gold Harp Gradient -->
    <linearGradient id="goldHarp" x1="160" y1="50" x2="380" y2="360" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#fef08a" />
      <stop offset="25%" stop-color="#fbbf24" />
      <stop offset="65%" stop-color="#f59e0b" />
      <stop offset="100%" stop-color="#b45309" />
    </linearGradient>

    <!-- Book Spine & Cover Gradient -->
    <linearGradient id="bookCoverGrad" x1="80" y1="300" x2="432" y2="430" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#3730a3" />
      <stop offset="50%" stop-color="#4f46e5" />
      <stop offset="100%" stop-color="#1e1b4b" />
    </linearGradient>

    <!-- Pages Gradient -->
    <linearGradient id="pageGrad" x1="100" y1="310" x2="412" y2="390" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#ffffff" />
      <stop offset="50%" stop-color="#f1f5f9" />
      <stop offset="100%" stop-color="#e2e8f0" />
    </linearGradient>

    <!-- Ribbon Gradient -->
    <linearGradient id="ribbonGrad" x1="230" y1="360" x2="282" y2="470" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#ef4444" />
      <stop offset="50%" stop-color="#dc2626" />
      <stop offset="100%" stop-color="#991b1b" />
    </linearGradient>

    <!-- Soft Aura Filter -->
    <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="8" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>

  <!-- Squircle Background for App Icon (Windows Taskbar & Desktop) -->
  <rect x="18" y="18" width="476" height="476" rx="108" fill="url(#bgGrad)" stroke="url(#borderGrad)" stroke-width="8" />

  <!-- Ambient Light Backing -->
  <circle cx="256" cy="210" r="130" fill="#6366f1" opacity="0.18" filter="url(#softGlow)" />
  <circle cx="256" cy="190" r="70" fill="#fbbf24" opacity="0.2" filter="url(#softGlow)" />

  <!-- 1. Open Book Base (Trim and Cover) -->
  <path d="M 84 395 C 150 366 210 371 256 395 C 302 371 362 366 428 395 L 428 335 C 362 306 302 311 256 335 C 210 311 150 306 84 335 Z"
        fill="url(#bookCoverGrad)" stroke="#6366f1" stroke-width="4" stroke-linejoin="round" />

  <!-- 2. Book Pages Layer -->
  <path d="M 94 380 C 154 353 212 358 256 380 C 300 358 358 353 418 380 L 418 325 C 358 298 300 303 256 325 C 212 303 154 298 94 325 Z"
        fill="url(#pageGrad)" stroke="#94a3b8" stroke-width="2.5" stroke-linejoin="round" />

  <!-- Center Book Spine Crease -->
  <line x1="256" y1="325" x2="256" y2="395" stroke="#475569" stroke-width="3" stroke-linecap="round" />

  <!-- 3. Concert Harp Base Rest -->
  <path d="M 166 350 L 346 350" stroke="url(#goldHarp)" stroke-width="12" stroke-linecap="round" />

  <!-- 4. Graceful Harp Harmonic Arch & Pillar -->
  <path d="M 186 350 C 186 240 170 110 240 70 C 295 38 360 70 375 130 C 390 180 365 240 330 350"
        fill="none" stroke="url(#goldHarp)" stroke-width="18" stroke-linecap="round" stroke-linejoin="round" filter="url(#softGlow)" />
  <path d="M 186 350 C 186 240 170 110 240 70 C 295 38 360 70 375 130 C 390 180 365 240 330 350"
        fill="none" stroke="#fef08a" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" opacity="0.85" />

  <!-- 5. Golden Resonant Harp Strings -->
  <line x1="228" y1="102" x2="208" y2="346" stroke="#fef08a" stroke-width="3.5" opacity="0.9" />
  <line x1="255" y1="86"  x2="238" y2="346" stroke="#fef08a" stroke-width="3.5" opacity="0.9" />
  <line x1="285" y1="88"  x2="272" y2="346" stroke="#fef08a" stroke-width="3.5" opacity="0.9" />
  <line x1="315" y1="105" x2="304" y2="346" stroke="#fef08a" stroke-width="3.5" opacity="0.9" />
  <line x1="344" y1="135" x2="330" y2="346" stroke="#fef08a" stroke-width="3.5" opacity="0.9" />

  <!-- 6. Hanging Crimson Ribbon Bookmark with Swallowtail Cut -->
  <path d="M 236 365 L 236 468 L 256 448 L 276 468 L 276 365 Z"
        fill="url(#ribbonGrad)" stroke="#7f1d1d" stroke-width="2.5" stroke-linejoin="round" />
  <line x1="256" y1="370" x2="256" y2="438" stroke="#f59e0b" stroke-width="2.5" stroke-dasharray="5 3" />

  <!-- 7. Celestial Accent Star -->
  <path d="M 370 70 Q 370 85 385 85 Q 370 85 370 100 Q 370 85 355 85 Q 370 85 370 70 Z" fill="#fef08a" />
  <circle cx="370" cy="85" r="3.5" fill="#ffffff" />
  <circle cx="146" cy="190" r="3" fill="#fbbf24" opacity="0.8" />
  <circle cx="384" cy="225" r="3" fill="#fde68a" opacity="0.8" />
</svg>`;

/**
 * Packs multiple PNG buffers into a valid Windows ICO buffer.
 */
function packIco(pngBuffers) {
  const count = pngBuffers.length;
  const headerSize = 6;
  const dirEntrySize = 16;
  let offset = headerSize + count * dirEntrySize;

  const header = Buffer.alloc(headerSize);
  header.writeUInt16LE(0, 0); // Reserved
  header.writeUInt16LE(1, 2); // 1 = ICO type
  header.writeUInt16LE(count, 4); // Number of images

  const dirEntries = [];
  for (const { width, height, buffer } of pngBuffers) {
    const entry = Buffer.alloc(dirEntrySize);
    entry.writeUInt8(width >= 256 ? 0 : width, 0);
    entry.writeUInt8(height >= 256 ? 0 : height, 1);
    entry.writeUInt8(0, 2); // Color palette
    entry.writeUInt8(0, 3); // Reserved
    entry.writeUInt16LE(1, 4); // Color planes
    entry.writeUInt16LE(32, 6); // Bits per pixel
    entry.writeUInt32LE(buffer.length, 8); // Size of image
    entry.writeUInt32LE(offset, 12); // Offset of image

    dirEntries.push(entry);
    offset += buffer.length;
  }

  return Buffer.concat([header, ...dirEntries, ...pngBuffers.map((b) => b.buffer)]);
}

app.whenReady().then(async () => {
  try {
    const win = new BrowserWindow({
      width: 512,
      height: 512,
      show: false,
      frame: false,
      transparent: true,
      webPreferences: {
        offscreen: true,
      },
    });

    const dataUri = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(SVG_CONTENT);
    await win.loadURL(dataUri);

    // Wait slightly for rendering
    await new Promise((r) => setTimeout(r, 400));

    const image512 = await win.webContents.capturePage();
    console.log("Captured 512x512 image, size:", image512.getSize());

    const sizes = [256, 128, 64, 48, 32, 24, 16];
    const pngBuffers = [];

    for (const size of sizes) {
      const resized = image512.resize({ width: size, height: size, quality: "best" });
      const buffer = resized.toPNG();
      pngBuffers.push({ width: size, height: size, buffer });
    }

    // Ensure build/ and public/ dirs exist
    const buildDir = path.join(__dirname, "../build");
    const publicDir = path.join(__dirname, "../public");
    const tauriIconsDir = path.join(__dirname, "../src-tauri/icons");

    if (!fs.existsSync(buildDir)) fs.mkdirSync(buildDir, { recursive: true });
    if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });

    // 1. Write build/icon.ico (Windows multi-res ICO)
    const icoBuffer = packIco(pngBuffers);
    fs.writeFileSync(path.join(buildDir, "icon.ico"), icoBuffer);
    console.log("Wrote build/icon.ico (" + icoBuffer.length + " bytes)");

    // 2. Write build/icon.png (256x256) and 512x512
    const png256 = pngBuffers.find((b) => b.width === 256).buffer;
    fs.writeFileSync(path.join(buildDir, "icon.png"), png256);
    fs.writeFileSync(path.join(buildDir, "icon-512.png"), image512.toPNG());
    console.log("Wrote build/icon.png");

    // 3. Write public/ assets for web/Vite
    fs.writeFileSync(path.join(publicDir, "icon.ico"), icoBuffer);
    fs.writeFileSync(path.join(publicDir, "icon.png"), png256);
    fs.writeFileSync(path.join(publicDir, "icon.svg"), SVG_CONTENT);
    console.log("Wrote public/icon.ico, public/icon.png, public/icon.svg");

    // 4. Update src-tauri icons if directory exists
    if (fs.existsSync(tauriIconsDir)) {
      fs.writeFileSync(path.join(tauriIconsDir, "icon.ico"), icoBuffer);
      fs.writeFileSync(path.join(tauriIconsDir, "icon.png"), image512.toPNG());
      for (const { width, buffer } of pngBuffers) {
        if (width === 128) fs.writeFileSync(path.join(tauriIconsDir, "128x128.png"), buffer);
        if (width === 32) fs.writeFileSync(path.join(tauriIconsDir, "32x32.png"), buffer);
      }
      console.log("Updated src-tauri icons");
    }

    console.log("SUCCESS: All professional icons generated!");
    app.quit();
  } catch (err) {
    console.error("Error generating icons:", err);
    process.exit(1);
  }
});
