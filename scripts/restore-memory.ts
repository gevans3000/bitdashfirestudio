import fs from "fs";
import {
  memPath,
  snapshotPath,
  atomicWrite,
  withFileLock,
} from "./memory-utils";

const [backup, target] = process.argv.slice(2);

if (!backup || !target || (target !== "memory" && target !== "snapshot")) {
  console.error(
    "Usage: ts-node scripts/restore-memory.ts <backup-file> <memory|snapshot>",
  );
  process.exit(1);
}

if (!fs.existsSync(backup)) {
  console.error(`Backup file not found: ${backup}`);
  process.exit(1);
}

const dest = target === "memory" ? memPath : snapshotPath;
const data = fs.readFileSync(backup, "utf8");

withFileLock(dest, () => {
  atomicWrite(dest, data);
});
console.log(`${dest} restored from ${backup}`);
