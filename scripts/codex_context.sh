#!/usr/bin/env bash
# Prints 333-token commit memory + 333-token task block.

COMMITS=$(git log -n5 --pretty=format:'• %s – %b' | head -c 2000)     # ≈333 tokens
TASKS=$(grep '^- \[ \]' TASKS.md | head -n15 | sed 's/^- \[ \] //' | head -c 2000)  # ≈333

cat <<EOF
[MEMORY PREAMBLE—DO NOT EDIT BELOW]
Recent commits (333 tokens):
$COMMITS

Pending tasks (333 tokens):
$TASKS
[END MEMORY PREAMBLE]
EOF

