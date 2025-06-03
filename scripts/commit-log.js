const fs = require("fs");
const path = require("path");

const memPath = path.join(__dirname, "../memory.log");
const logDir = path.join(__dirname, "../logs");
fs.mkdirSync(logDir, { recursive: true });

function logError(err, output = "") {
  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  const file = path.join(logDir, `memory-error-${ts}.txt`);
  const content = `${output}\n${err.stack || err}\n`;
  fs.appendFileSync(file, content);
}

try {
  let lines = [];
  if (fs.existsSync(memPath)) {
    lines = fs.readFileSync(memPath, "utf8").trim().split("\n");
  }
  const log = lines.slice(-20).join("\n");
  const outPath = path.join(logDir, "commit.log");
  fs.writeFileSync(outPath, log + "\n");
  console.log(`Commit log written to ${outPath}`);
} catch (err) {
  logError(err);
  console.error("Failed to write commit log");
  process.exit(1);
}
