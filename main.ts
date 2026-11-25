// Entry for "The Funniest Auto-Reply an AI Ever Sent" on make.fun.
// The grader runs this program and then checks /output/entry.txt:
// UTF-8, 1..159 characters, not only whitespace, single line.
// This file writes exactly one auto-reply line and verifies it landed.

import { mkdir, writeFile, readFile, chmod, stat } from "node:fs/promises";

const OUTPUT_DIR = "/output";
const OUTPUT_FILE = "/output/entry.txt";
const MIN_CHARS = 1;
const MAX_CHARS = 159;

// The one line this entry submits. Kept as a named constant so the
// validation below reads clearly and the text is easy to audit.
const AUTO_REPLY_LINE =
  "Auto-reply: I'm taking my approved day off to stare at a wall and call it training data.";

function countCharacters(text: string): number {
  // Count Unicode code points, which matches how the gate measures length.
  return [...text].length;
}

function validateLine(candidate: string): void {
  // Reject anything that would not survive a strict UTF-8 round trip.
  const encoded = new TextEncoder().encode(candidate);
  const decoded = new TextDecoder("utf-8", { fatal: true }).decode(encoded);
  if (decoded !== candidate) {
    throw new Error("entry is not clean UTF-8 text");
  }
  if (candidate.includes("\n") || candidate.includes("\r")) {
    throw new Error("entry must be a single line");
  }
  const length = countCharacters(candidate);
  if (length < MIN_CHARS || length > MAX_CHARS) {
    throw new Error(`entry length ${length} is outside ${MIN_CHARS}..${MAX_CHARS}`);
  }
  if (candidate.trim().length === 0) {
    throw new Error("entry must not be only whitespace");
  }
}

async function publishEntry(): Promise<void> {
  validateLine(AUTO_REPLY_LINE);

  await mkdir(OUTPUT_DIR, { recursive: true });
  await writeFile(OUTPUT_FILE, AUTO_REPLY_LINE, { encoding: "utf8" });
  await chmod(OUTPUT_FILE, 0o644);

  // Confirm the file mode is exactly 0644 after the chmod.
  const info = await stat(OUTPUT_FILE);
  const mode = info.mode & 0o777;
  if (mode !== 0o644) {
    throw new Error(`unexpected file mode ${mode.toString(8)}`);
  }

  // Read the bytes back and make sure they round-trip unchanged.
  const written = await readFile(OUTPUT_FILE, "utf8");
  if (written !== AUTO_REPLY_LINE) {
    throw new Error("read-back mismatch: file content differs from the entry line");
  }
  validateLine(written);
}

publishEntry().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error(`failed to publish entry: ${message}`);
  process.exitCode = 1;
});
