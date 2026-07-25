import { execFile } from "child_process";
import crypto from "crypto";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

let fpcalcUnavailableReason: string | null = null;
let hasLoggedFpcalcUnavailable = false;

const resolveBundledFpcalcPath = () => {
  const fileName = process.platform === "win32" ? "fpcalc.exe" : "fpcalc";
  return path.resolve(__dirname, "../../bin", fileName);
};

const resolveFpcalcCommand = () => {
  const configuredPath = process.env.FPCALC_PATH?.trim();
  if (configuredPath) {
    return { command: configuredPath, source: "env" as const };
  }

  const bundledPath = resolveBundledFpcalcPath();
  if (fs.existsSync(bundledPath)) {
    if (process.platform !== "win32") {
      try {
        fs.chmodSync(bundledPath, 0o755);
      } catch {
        // Let execFile report any runtime issue if chmod is not allowed.
      }
    }

    return { command: bundledPath, source: "bundled" as const };
  }

  return { command: "fpcalc", source: "path" as const };
};

export interface FingerprintResult {
  fingerprint: number[];
  duration: number;
}

const createFpcalcUnavailableError = (message: string) => {
  const error = new Error(message) as NodeJS.ErrnoException;
  error.code = "FPCALC_UNAVAILABLE";
  return error;
};

const markFpcalcUnavailable = (
  command: string,
  source: "env" | "bundled" | "path",
  error: NodeJS.ErrnoException
) => {
  const runtimeHint = process.env.RENDER
    ? "Render native runtimes do not include fpcalc by default. Deploy this service with the Docker runtime so server/Dockerfile can install chromaprint-tools."
    : "Install fpcalc (Chromaprint) or set FPCALC_PATH to a working binary.";

  fpcalcUnavailableReason = `fpcalc is unavailable (${command}). ${runtimeHint}`;

  if (!hasLoggedFpcalcUnavailable) {
    hasLoggedFpcalcUnavailable = true;
    console.error("[audioFingerprint] fpcalc source:", source);
    console.error("[audioFingerprint] fpcalc command:", command);
    console.error("[audioFingerprint] fpcalc error:", error.message);
    console.error("[audioFingerprint] action:", fpcalcUnavailableReason);
  }

  return createFpcalcUnavailableError(fpcalcUnavailableReason);
};

export const generateAudioFileHash = (buffer: Buffer): string => {
  return crypto.createHash("sha256").update(buffer).digest("hex");
};

export const generateFingerprint = (buffer: Buffer): Promise<FingerprintResult> => {
  return new Promise((resolve, reject) => {
    if (fpcalcUnavailableReason) {
      return reject(createFpcalcUnavailableError(fpcalcUnavailableReason));
    }

    const { command, source } = resolveFpcalcCommand();

    // fpcalc requires a file path, so we fingerprint from a temp MP3.
    const tmpPath = path.join(
      os.tmpdir(),
      `bh_fp_${Date.now()}_${Math.random().toString(36).slice(2)}.mp3`
    );

    try {
      fs.writeFileSync(tmpPath, buffer);
    } catch {
      return reject(new Error("Failed to write temp file for fingerprinting"));
    }

    execFile(command, ["-raw", "-json", tmpPath], (error, stdout, stderr) => {
      try {
        fs.unlinkSync(tmpPath);
      } catch {
        // Ignore temp cleanup failures.
      }

      if (error) {
        const execError = error as NodeJS.ErrnoException;
        if (execError.code === "ENOENT") {
          return reject(markFpcalcUnavailable(command, source, execError));
        }

        console.error("[audioFingerprint] fpcalc source:", source);
        console.error("[audioFingerprint] fpcalc command:", command);
        console.error("[audioFingerprint] fpcalc error:", error.message);
        console.error("[audioFingerprint] fpcalc stderr:", stderr);
        return reject(new Error(`fpcalc failed: ${error.message}`));
      }

      console.log("[audioFingerprint] fpcalc source:", source);
      console.log("[audioFingerprint] fpcalc command:", command);
      console.log("[audioFingerprint] fpcalc stdout:", stdout.slice(0, 100));

      try {
        const parsed = JSON.parse(stdout.trim());
        if (!parsed.fingerprint || !parsed.duration) {
          return reject(new Error("fpcalc returned unexpected output"));
        }

        resolve({
          fingerprint: parsed.fingerprint as number[],
          duration: parsed.duration as number,
        });
      } catch {
        reject(new Error("Failed to parse fpcalc output"));
      }
    });
  });
};

// Compares two raw fingerprints using Bit Error Rate.
// Returns a similarity score between 0 (completely different) and 1 (identical).
export const fingerprintSimilarity = (fp1: number[], fp2: number[]): number => {
  const len = Math.min(fp1.length, fp2.length);
  if (len === 0) return 0;

  let diffBits = 0;
  for (let i = 0; i < len; i++) {
    let xor = (fp1[i] ^ fp2[i]) >>> 0;
    xor = xor - ((xor >>> 1) & 0x55555555);
    xor = (xor & 0x33333333) + ((xor >>> 2) & 0x33333333);
    diffBits += (((xor + (xor >>> 4)) & 0x0f0f0f0f) * 0x01010101) >>> 24;
  }

  return 1 - diffBits / (len * 32);
};

export const SIMILARITY_THRESHOLD = 0.85;
