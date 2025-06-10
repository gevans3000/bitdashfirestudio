#!/usr/bin/env bash
# Prints recent commit summaries and pending tasks.

COMMITS=$(git log -n5 --pretty=format:'• %s – %b')
TASKS=$(grep '^- \[ \]' TASKS.md | head -n15 | sed 's/^- \[ \] //')

cat <<EOF
[MEMORY PREAMBLE—DO NOT EDIT BELOW]
Recent commits (333 tokens):
$COMMITS

Pending tasks (333 tokens):
$TASKS
[END MEMORY PREAMBLE]
EOF

