import * as cp from 'child_process';

describe('codex-context', () => {
  it('prints commit and task sections', () => {
    const out = cp.execSync('bash scripts/codex_context.sh', { encoding: 'utf8' });
    expect(out).toContain('### Recent commits:');
    expect(out).toContain('### Pending tasks (first 20 lines of TASKS.md):');
  });
});
