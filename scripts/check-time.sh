#!/usr/bin/env bash
set -e

# Compare local time with NTP server time
output=$(ntpdate -q pool.ntp.org 2>/dev/null | tail -n 1)
if [[ -z "$output" ]]; then
  echo "Unable to query NTP server" >&2
  exit 1
fi
offset=$(echo "$output" | awk '{for(i=1;i<=NF;i++){if($i=="offset"){print $(i+1);exit}}}')
if [[ -z "$offset" ]]; then
  echo "Could not parse NTP offset" >&2
  exit 1
fi
echo "Clock offset vs pool.ntp.org: $offset sec"


