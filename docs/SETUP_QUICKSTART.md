# BitDash Firestudio Quickstart

Follow these steps to get the project running locally.

1. Clone the repository and run `npm run dev-deps` to install dependencies if `node_modules` is missing. The script restores `.cache/node_modules.tar.gz` when available for faster setup.
2. Copy `.env.example` to `.env.local` and adjust settings as needed.
3. Run `npm run lint && npm run test && npm run backtest` to verify the environment.
4. Start the development server with `npm run dev`.
5. Optionally run `npm run memory archive` to back up memory logs. Use `npm run memory restore <file> <memory|snapshot>` to recover from an archive.
6. Use `npm run memory <command>` for log maintenance. For example `npm run memory rotate` trims `memory.log` and `npm run memory check` verifies consistency.

Refer to `AGENTS.md` for automation details and `README.md` for full documentation.
