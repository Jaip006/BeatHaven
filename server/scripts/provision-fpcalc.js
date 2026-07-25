const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const VERSION = (process.env.FPCALC_VERSION || "1.6.0").trim();
const CUSTOM_URL = process.env.FPCALC_DOWNLOAD_URL?.trim();
const ROOT_DIR = path.resolve(__dirname, "..");
const BIN_DIR = path.join(ROOT_DIR, "bin");

const SUPPORTED_ASSETS = {
  linux: {
    x64: `chromaprint-fpcalc-${VERSION}-linux-x86_64.tar.gz`,
    arm64: `chromaprint-fpcalc-${VERSION}-linux-arm64.tar.gz`,
  },
  darwin: {
    x64: `chromaprint-fpcalc-${VERSION}-macos-x86_64.tar.gz`,
    arm64: `chromaprint-fpcalc-${VERSION}-macos-arm64.tar.gz`,
  },
};

const readAscii = (buffer, start, end) =>
  buffer
    .subarray(start, end)
    .toString("utf8")
    .replace(/\0.*$/, "")
    .trim();

const isZeroBlock = (buffer) => {
  for (let i = 0; i < buffer.length; i += 1) {
    if (buffer[i] !== 0) return false;
  }
  return true;
};

const extractTarEntry = (archiveBuffer, matcher) => {
  let offset = 0;

  while (offset + 512 <= archiveBuffer.length) {
    const header = archiveBuffer.subarray(offset, offset + 512);
    if (isZeroBlock(header)) {
      return null;
    }

    const name = readAscii(header, 0, 100);
    const prefix = readAscii(header, 345, 500);
    const typeFlag = readAscii(header, 156, 157) || "0";
    const size = Number.parseInt(readAscii(header, 124, 136) || "0", 8) || 0;
    const entryName = prefix ? `${prefix}/${name}` : name;
    const contentStart = offset + 512;
    const contentEnd = contentStart + size;

    if ((typeFlag === "0" || typeFlag === "") && matcher.test(entryName)) {
      return Buffer.from(archiveBuffer.subarray(contentStart, contentEnd));
    }

    offset = contentStart + Math.ceil(size / 512) * 512;
  }

  return null;
};

const resolveDesiredBinary = () => {
  if (process.env.FPCALC_PATH?.trim()) {
    return null;
  }

  if (process.platform === "win32") {
    return {
      destination: path.join(BIN_DIR, "fpcalc.exe"),
      downloadUrl: null,
      supported: true,
    };
  }

  const asset = SUPPORTED_ASSETS[process.platform]?.[process.arch];
  if (!asset) {
    return {
      destination: path.join(BIN_DIR, "fpcalc"),
      downloadUrl: null,
      supported: false,
    };
  }

  return {
    destination: path.join(BIN_DIR, "fpcalc"),
    downloadUrl:
      CUSTOM_URL ||
      `https://github.com/acoustid/chromaprint/releases/download/v${VERSION}/${asset}`,
    supported: true,
  };
};

const ensureExecutable = (filePath) => {
  if (process.platform !== "win32" && fs.existsSync(filePath)) {
    fs.chmodSync(filePath, 0o755);
  }
};

const downloadArchive = async (url) => {
  const response = await fetch(url, {
    headers: {
      "user-agent": "BeatHaven-fpcalc-provisioner",
    },
  });

  if (!response.ok) {
    throw new Error(`Download failed with status ${response.status} for ${url}`);
  }

  return Buffer.from(await response.arrayBuffer());
};

const failOrWarn = (message) => {
  const shouldFail = process.env.RENDER === "true" || process.platform === "linux";
  if (shouldFail) {
    throw new Error(message);
  }

  console.warn(`[fpcalc] ${message}`);
};

const main = async () => {
  const target = resolveDesiredBinary();
  if (!target) {
    console.log("[fpcalc] Skipping provisioning because FPCALC_PATH is set.");
    return;
  }

  if (fs.existsSync(target.destination)) {
    ensureExecutable(target.destination);
    console.log(`[fpcalc] Using bundled binary at ${target.destination}`);
    return;
  }

  if (!target.supported || !target.downloadUrl) {
    failOrWarn(
      `No bundled fpcalc binary is available for platform=${process.platform} arch=${process.arch}.`
    );
    return;
  }

  fs.mkdirSync(BIN_DIR, { recursive: true });

  console.log(`[fpcalc] Downloading ${target.downloadUrl}`);
  const compressedArchive = await downloadArchive(target.downloadUrl);
  const archive = zlib.gunzipSync(compressedArchive);
  const executable = extractTarEntry(archive, /(^|\/)fpcalc$/);

  if (!executable) {
    throw new Error("Downloaded archive did not contain an fpcalc executable.");
  }

  fs.writeFileSync(target.destination, executable);
  ensureExecutable(target.destination);
  console.log(`[fpcalc] Provisioned binary at ${target.destination}`);
};

main().catch((error) => {
  console.error("[fpcalc] Provisioning failed:", error.message);
  process.exit(1);
});
