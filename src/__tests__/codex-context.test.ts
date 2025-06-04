import fs from 'fs';
import os from 'os';
import path from 'path';
import * as cp from 'child_process';

describe('codex-context', () => {
  it('prints recent commits and next task', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'codex-'));
    const tasks = path.join(dir, 'TASKS.md');
    fs.writeFileSync(tasks, '- [ ] Task 1: sample\n');

    const execMock = jest
      .spyOn(cp, 'execSync')
      .mockImplementation((cmd: string) => {
        if (cmd.startsWith('git rev-parse')) return Buffer.from(dir);
        if (cmd.startsWith('git log'))
          return Buffer.from('- a123 first\n- b456 second');
        return Buffer.from('');
      });
    const logMock = jest.spyOn(console, 'log').mockImplementation(() => {});

    jest.isolateModules(() => {
      require('../../scripts/codex-context.ts');
    });

    expect(logMock).toHaveBeenCalledWith(
      'Recent work:\n- a123 first\n- b456 second\nNext task: Task 1: sample'
    );

    execMock.mockRestore();
    logMock.mockRestore();
    fs.rmSync(dir, { recursive: true, force: true });
  });
});
