#!/bin/zsh
# compact word diffs for the first N text problems: scripts/tmp/wd.sh [grep-filter] [max]
export PATH="$PWD/tools.nosync/bin:$PATH"
grep "text" scripts/tmp/text-problems.txt | grep -E "${1:-.}" | head -${2:-20} | while read -r id t key rest; do
  echo "== $id $key"; npx tsx scripts/tmp/wdiff.ts $id $key 2>&1 | grep -v "npm notice" | cut -c1-${3:-700}
done
