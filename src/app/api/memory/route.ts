import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

interface MemoryEntry {
  hash: string;
  summary: string;
  timestamp: string;
}

let cache: { data: MemoryEntry[]; ts: number } | null = null;
const CACHE_DURATION = 15 * 1000;

export async function GET() {
  if (cache && Date.now() - cache.ts < CACHE_DURATION) {
    return NextResponse.json({ entries: cache.data, status: 'cached' });
  }
  try {
    const memPath = process.env.MEM_PATH
      ? path.resolve(process.env.MEM_PATH)
      : path.join(process.cwd(), 'memory.log');
    const content = fs.existsSync(memPath)
      ? fs.readFileSync(memPath, 'utf8').trim()
      : '';
    const lines = content ? content.split('\n') : [];
    const entries: MemoryEntry[] = lines.map((line) => {
      const parts = line.split('|').map((p) => p.trim());
      const hash = parts[0];
      const summary = parts.length === 5 ? parts[2] : parts[1];
      const timestamp = parts[parts.length - 1];
      return { hash, summary, timestamp };
    });
    entries.sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    );
    cache = { data: entries, ts: Date.now() };
    return NextResponse.json({ entries, status: 'fresh' });
  } catch (e) {
    console.error('Memory API error', e);
    if (cache)
      return NextResponse.json({ entries: cache.data, status: 'cached_error' });
    return NextResponse.json({ entries: [], status: 'error' });
  }
}
