import fs from "fs";
import os from "os";
import path from "path";
import * as cp from "child_process";
import * as utils from "../../scripts/memory-utils";

const { memPath, repoRoot } = utils;

function withFsMocks(paths: Record<string, string>, fn: () => void) {
  const origExists = fs.existsSync;
  const origRead = fs.readFileSync;
  const origWrite = fs.writeFileSync;
  const existsMock = jest
    .spyOn(fs, "existsSync")
    .mockImplementation((p: any) => {
      if (paths[p as string]) {
        return origExists.call(fs, paths[p as string]);
      }
      return origExists.call(fs, p);
    });
  const readMock = jest
    .spyOn(fs, "readFileSync")
    .mockImplementation((p: any, opt?: any) => {
      if (paths[p as string]) {
        p = paths[p as string];
      }
      return origRead.call(fs, p, opt);
    });
  const writeMock = jest
    .spyOn(fs, "writeFileSync")
    .mockImplementation((p: any, data: any, opt?: any) => {
      if (paths[p as string]) {
        p = paths[p as string];
      }
      return origWrite.call(fs, p, data, opt as any);
    });
  try {
    fn();
  } finally {
    existsMock.mockRestore();
    readMock.mockRestore();
    writeMock.mockRestore();
  }
}

const commitLogPath = path.join(repoRoot, "logs/commit.log");

describe("mem-rotate", () => {
  it("truncates memory.log and rewrites commit.log", () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "memrot-"));
    const tmpMem = path.join(tmpDir, "memory.log");
    const tmpCommit = path.join(tmpDir, "commit.log");
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

    withFsMocks({ [memPath]: tmpMem, [commitLogPath]: tmpCommit }, () => {
      process.env.MEM_ROTATE_LIMIT = "3";
      jest.isolateModules(() => {
        require("../../scripts/mem-rotate.ts");
      });
    });

    execMock.mockRestore();
    const memOut = fs.readFileSync(tmpMem, "utf8");
    const commitOut = fs.readFileSync(tmpCommit, "utf8");
    expect(memOut).toBe("4\n5\n6\n");
    expect(commitOut).toBe("4\n5\n6\n");

    fs.rmSync(tmpDir, { recursive: true, force: true });
  });
});
