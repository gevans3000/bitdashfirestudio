import fs from "fs";
import os from "os";
import path from "path";
import * as cp from "child_process";
import * as utils from "../../scripts/memory-utils";
import * as cli from "../../scripts/memory-cli";

const { snapshotPath, memPath } = utils;

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
    .mockImplementation((fd: any) => {
      return origClose.call(fs, fd);
    });
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

describe("nextMemId", () => {
  it("returns 001 when snapshot missing", () => {
    withFsMocks({ [snapshotPath]: path.join(os.tmpdir(), "no-file") }, () => {
      expect(utils.nextMemId()).toBe("001");
    });
  });

  it("increments based on last mem entry", () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "memtest-"));
    const tmpSnap = path.join(tmpDir, "context.snapshot.md");
    fs.writeFileSync(
      tmpSnap,
      "### 2020-01-01 | mem-001\n" +
        "some text\n" +
        "### 2020-01-02 | mem-009\n",
    );
    withFsMocks({ [snapshotPath]: tmpSnap }, () => {
      expect(utils.nextMemId()).toBe("010");
    });
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("computes id from provided content", () => {
    const content = "### 2020-01-01 | mem-002\n";
    expect(utils.nextMemId(content)).toBe("003");
  });
});

describe("update-log", () => {
  it("appends new commit entries from git log", () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "memlog-"));
    const tmpMem = path.join(tmpDir, "memory.log");
    fs.writeFileSync(
      tmpMem,
      "abc123 | old commit | file1 | 2025-06-01T00:00:00Z\n",
    );

    const execMock = jest
      .spyOn(cp, "execSync")
      .mockImplementation((cmd: string) => {
        if (cmd.startsWith("git cat-file -e")) return Buffer.from("");
        if (cmd.startsWith("git log")) {
          return Buffer.from(
            "def456|new commit|2025-06-02T00:00:00Z\n" +
              "src/a.ts\n" +
              "src/b.ts\n",
          );
        }
        return Buffer.from("");
      });

    withFsMocks({ [memPath]: tmpMem }, () => {
      cli.updateLog();
    });

    execMock.mockRestore();
    const out = fs.readFileSync(tmpMem, "utf8").trim().split("\n");
    expect(out).toEqual([
      "abc123 | old commit | file1 | 2025-06-01T00:00:00Z",
      "def456 | new commit | src/a.ts, src/b.ts | 2025-06-02T00:00:00Z",
    ]);
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("runs memory-check when --verify flag passed", () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "memlog-"));
    const tmpMem = path.join(tmpDir, "memory.log");
    fs.writeFileSync(tmpMem, "");

    const execMock = jest
      .spyOn(cp, "execSync")
      .mockImplementation((cmd: string) => {
        if (cmd.startsWith("git cat-file -e")) return Buffer.from("");
        if (cmd.startsWith("git log")) {
          return Buffer.from("abc123|a commit|2025-06-02T00:00:00Z\n");
        }
        return Buffer.from("");
      });

    withFsMocks({ [memPath]: tmpMem }, () => {
      cli.updateLog(true);
    });

    expect(execMock).toHaveBeenCalledWith(
      "ts-node scripts/memory-check.ts",
      expect.objectContaining({ cwd: repoRoot, stdio: "inherit" }),
    );

    execMock.mockRestore();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("deduplicates existing entries", () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "memlog-"));
    const tmpMem = path.join(tmpDir, "memory.log");
    fs.writeFileSync(
      tmpMem,
      "abc123 | a commit | file1 | 2025-06-01T00:00:00Z\n" +
        "abc123 | a commit | file1 | 2025-06-01T00:00:00Z\n"
    );

    const execMock = jest
      .spyOn(cp, "execSync")
      .mockReturnValue(Buffer.from(""));

    withFsMocks({ [memPath]: tmpMem }, () => {
      cli.updateLog();
    });

    execMock.mockRestore();
    const out = fs.readFileSync(tmpMem, "utf8").trim().split("\n");
    expect(out).toEqual([
      "abc123 | a commit | file1 | 2025-06-01T00:00:00Z",
    ]);

    fs.rmSync(tmpDir, { recursive: true, force: true });
  });
});

describe("atomicWrite", () => {
  it("calls fsync before rename", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "atomic-"));
    const file = path.join(dir, "out.txt");
    const fsync = jest.spyOn(fs, "fsyncSync").mockImplementation(() => {});

    utils.atomicWrite(file, "data");

    expect(fsync).toHaveBeenCalled();

    fsync.mockRestore();
    const out = fs.readFileSync(file, "utf8");
    expect(out).toBe("data");
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it("fsyncs file and directory", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "atomic-"));
    const file = path.join(dir, "out.txt");
    const origOpen = fs.openSync;
    const openSpy = jest
      .spyOn(fs, "openSync")
      .mockImplementation((p: any, f: any) => origOpen.call(fs, p, f));
    const fsync = jest.spyOn(fs, "fsyncSync").mockImplementation(() => {});

    utils.atomicWrite(file, "data");

    expect(openSpy).toHaveBeenCalledTimes(2);
    expect(openSpy.mock.calls[1][0]).toBe(dir);
    expect(openSpy.mock.calls[1][1]).toBe("r");
    expect(fsync).toHaveBeenCalledTimes(2);

    openSpy.mockRestore();
    fsync.mockRestore();
    const out = fs.readFileSync(file, "utf8");
    expect(out).toBe("data");
    fs.rmSync(dir, { recursive: true, force: true });
  });
});

describe("path overrides", () => {
  it("uses MEM_PATH and SNAPSHOT_PATH when set", () => {
    const mem = path.join(os.tmpdir(), "custom-mem.log");
    const snap = path.join(os.tmpdir(), "custom-snap.md");
    jest.isolateModules(() => {
      process.env.MEM_PATH = mem;
      process.env.SNAPSHOT_PATH = snap;
      const mod = require("../../scripts/memory-utils");
      expect(mod.memPath).toBe(path.resolve(mem));
      expect(mod.snapshotPath).toBe(path.resolve(snap));
      delete process.env.MEM_PATH;
      delete process.env.SNAPSHOT_PATH;
    });
  });

  it("defaults to repo root when env vars absent", () => {
    jest.isolateModules(() => {
      delete process.env.MEM_PATH;
      delete process.env.SNAPSHOT_PATH;
      const mod = require("../../scripts/memory-utils");
      expect(mod.memPath).toBe(path.join(mod.repoRoot, "memory.log"));
      expect(mod.snapshotPath).toBe(
        path.join(mod.repoRoot, "context.snapshot.md"),
      );
    });
  });
});

describe("parseMemoryLines", () => {
  it("parses lines with task prefix", () => {
    const line =
      "abc123 | Task 10 | add feature | a.ts, b.ts | 2025-01-01T00:00:00Z";
    const out = utils.parseMemoryLines([line]);
    expect(out).toEqual([
      {
        entryType: "task",
        hash: "abc123",
        task: "Task 10",
        description: "add feature",
        summary: "Task 10: add feature",
        files: "a.ts, b.ts",
        timestamp: "2025-01-01T00:00:00Z",
        raw: line,
      },
    ]);
  });

  it("parses simple lines", () => {
    const line = "def456 | fix bug | c.ts | 2025-01-02T00:00:00Z";
    const out = utils.parseMemoryLines([line]);
    expect(out[0]).toEqual({
      entryType: "commit",
      hash: "def456",
      summary: "fix bug",
      files: "c.ts",
      timestamp: "2025-01-02T00:00:00Z",
      raw: line,
    });
  });

  it("parses colon task format", () => {
    const line =
      "beef12 | Task 5: implement feature | d.ts | 2025-01-03T00:00:00Z";
    const [entry] = utils.parseMemoryLines([line]);
    expect(entry).toEqual({
      entryType: "task",
      hash: "beef12",
      task: "Task 5",
      description: "implement feature",
      summary: "Task 5: implement feature",
      files: "d.ts",
      timestamp: "2025-01-03T00:00:00Z",
      raw: line,
    });
  });

  it("ignores empty lines", () => {
    const out = utils.parseMemoryLines(["", "abc123 | a | b | 2025-01-01T00:00:00Z"]);
    expect(out.length).toBe(1);
    expect(out[0].hash).toBe("abc123");
  });

  it("handles malformed entries", () => {
    const line = "abc123 just text";
    const [entry] = utils.parseMemoryLines([line]);
    expect(entry.hash).toBe("abc123 just text");
    expect(entry.summary).toBe("");
    expect(entry.timestamp).toBe("");
  });

  it("handles extremely long lines", () => {
    const long = "a".repeat(10000);
    const line = `abcd123 | ${long} | file.ts | 2025-01-01T00:00:00Z`;
    const [entry] = utils.parseMemoryLines([line]);
    expect(entry.summary.length).toBe(10000);
    });
});

describe("validateMemoryEntry", () => {
  it("detects missing fields", () => {
    const [entry] = utils.parseMemoryLines(["abcd123 | test"]);
    const errs = utils.validateMemoryEntry(entry);
    expect(errs).toContain("invalid timestamp for abcd123");
    expect(errs).not.toContain("missing summary for abcd123");
  });

  it("passes for valid task entry", () => {
    const [entry] = utils.parseMemoryLines([
      "abcd123 | Task 2 | desc | f.ts | 2025-01-01T00:00:00Z",
    ]);
    const errs = utils.validateMemoryEntry(entry);
    expect(errs).toEqual([]);
  });
});

describe('parseSnapshotEntries', () => {
  it('parses snapshot blocks', () => {
    const lines = [
      '### 2025-01-01 00:00 UTC | mem-001',
      '- Commit SHA: abc123',
      '- Summary: first',
      '- Next Goal: a',
      '### 2025-01-02 00:00 UTC | mem-002',
      '- Commit SHA: def456',
      '- Summary: second',
      '- Next Goal: b',
    ];
    const out = utils.parseSnapshotEntries(lines);
    expect(out[0]).toEqual({
      id: 'mem-001',
      timestamp: '2025-01-01 00:00 UTC',
      commit: 'abc123',
      summary: 'first',
      next: 'a',
      raw:
        '### 2025-01-01 00:00 UTC | mem-001\n' +
        '- Commit SHA: abc123\n' +
        '- Summary: first\n' +
        '- Next Goal: a',
    });
    expect(out[1].id).toBe('mem-002');
  });
});
