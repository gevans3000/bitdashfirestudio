import * as cp from 'child_process';

describe('codex-context', () => {
  it('prints commit and task sections', () => {
    const out = cp.execSync('bash scripts/codex_context.sh', { encoding: 'utf8' });
    expect(out).toContain('[MEMORY PREAMBLE—DO NOT EDIT BELOW]');
    expect(out).toContain('Recent commits (333 tokens):');
    expect(out).toContain('Pending tasks (333 tokens):');
    expect(out).toContain('[END MEMORY PREAMBLE]');
  });
});
