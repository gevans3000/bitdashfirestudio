import fs from "fs";
import os from "os";
import path from "path";
import * as cp from "child_process";
import * as utils from "../../scripts/memory-utils";

const { memPath, repoRoot } = utils;

function withFsMocks(paths: Record<string, string>, fn: () => void) {
  const expanded: Record<string, string> = {};
  for (const [k, v] of Object.entries(paths)) {
    expanded[k] = v;
    const tmpK = path.join(path.dirname(k), `.${path.basename(k)}.tmp`);
    const tmpV = path.join(path.dirname(v), `.${path.basename(v)}.tmp`);
    expanded[tmpK] = tmpV;
    expanded[`${k}.lock`] = `${v}.lock`;
  }

  const origExists = fs.existsSync;
  const origRead = fs.readFileSync;
  const origWrite = fs.writeFileSync;
  const origRename = fs.renameSync;
  const origOpen = fs.openSync;
  const origClose = fs.closeSync;
  const origUnlink = fs.unlinkSync;
  const existsMock = jest
    .spyOn(fs, "existsSync")
    .mockImplementation((p: any) => {
      if (expanded[p as string]) {
        return origExists.call(fs, expanded[p as string]);
      }
      return origExists.call(fs, p);
    });
  const readMock = jest
    .spyOn(fs, "readFileSync")
    .mockImplementation((p: any, opt?: any) => {
      if (expanded[p as string]) {
        p = expanded[p as string];
      }
      return origRead.call(fs, p, opt);
    });
  const writeMock = jest
    .spyOn(fs, "writeFileSync")
    .mockImplementation((p: any, data: any, opt?: any) => {
      if (expanded[p as string]) {
        p = expanded[p as string];
      }
      return origWrite.call(fs, p, data, opt as any);
    });
  const renameMock = jest
    .spyOn(fs, "renameSync")
    .mockImplementation((a: any, b: any) => {
      if (expanded[a as string]) a = expanded[a as string];
      if (expanded[b as string]) b = expanded[b as string];
      return origRename.call(fs, a, b);
    });
  const openMock = jest
    .spyOn(fs, "openSync")
    .mockImplementation((p: any, flag: any) => {
      if (expanded[p as string]) p = expanded[p as string];
      return origOpen.call(fs, p, flag);
    });
  const closeMock = jest
    .spyOn(fs, "closeSync")
    .mockImplementation((fd: any) => origClose.call(fs, fd));
  const unlinkMock = jest
    .spyOn(fs, "unlinkSync")
    .mockImplementation((p: any) => {
      if (expanded[p as string]) p = expanded[p as string];
      return origUnlink.call(fs, p);
    });
  try {
    fn();
  } finally {
    existsMock.mockRestore();
    readMock.mockRestore();
    writeMock.mockRestore();
    renameMock.mockRestore();
    openMock.mockRestore();
    closeMock.mockRestore();
    unlinkMock.mockRestore();
  }
}

const commitLogPath = path.join(repoRoot, "logs/commit.log");
const iso = "2025-01-01T00:00:00.000Z";

describe("mem-rotate", () => {
  it("truncates memory.log and rewrites commit.log", () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "memrot-"));
    const tmpMem = path.join(tmpDir, "memory.log");
    const tmpCommit = path.join(tmpDir, "commit.log");
    const tmpBackup = path.join(tmpDir, `memory.log.${iso}.bak`);
    fs.writeFileSync(tmpMem, "1\n2\n3\n4\n5\n6\n");
    fs.writeFileSync(tmpCommit, "old log");

    const execMock = jest
      .spyOn(cp, "execSync")
      .mockImplementation((cmd: string) => {
        if (cmd.includes("commit-log.ts")) {
          jest.isolateModules(() => {
            require("../../scripts/commit-log.ts");
          });
        }
        return Buffer.from("");
      });

    const map = {
      [memPath]: tmpMem,
      [commitLogPath]: tmpCommit,
      [path.join(repoRoot, "logs", `memory.log.${iso}.bak`)]: tmpBackup,
    };
    withFsMocks(map, () => {
      process.env.MEM_ROTATE_LIMIT = "3";
      jest.useFakeTimers().setSystemTime(new Date(iso));
      jest.isolateModules(() => {
        require("../../scripts/mem-rotate.ts");
      });
      jest.useRealTimers();
    });

    execMock.mockRestore();
    const memOut = fs.readFileSync(tmpMem, "utf8");
    const commitOut = fs.readFileSync(tmpCommit, "utf8");
    const backupOut = fs.readFileSync(tmpBackup, "utf8");
    expect(memOut).toBe("4\n5\n6\n");
    expect(commitOut).toBe("4\n5\n6\n");
    expect(backupOut).toBe("1\n2\n3\n4\n5\n6\n");

    fs.rmSync(tmpDir, { recursive: true, force: true });
  });
});
