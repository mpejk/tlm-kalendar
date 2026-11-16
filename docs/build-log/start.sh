#!/bin/bash
# Mac or Linux. Run from the project folder:   bash start.sh
cd "$(dirname "$0")" || exit 1

PROMPT='Continue the job described in CLAUDE.md in this folder. If PLAN.md and RUNLOG.md exist, read them and carry on from the first unfinished item. Work without asking anything and do not stop until the file DONE exists.'
FLAGS=(--permission-mode auto --permission-prompts none)

if [ ! -f CLAUDE.md ]; then echo 'CANNOT START: CLAUDE.md is not in this folder.'; exit 1; fi
if ! command -v claude >/dev/null 2>&1; then echo 'CANNOT START: the claude command was not found.'; exit 1; fi

# Keep the Mac awake for as long as this script runs.
if command -v caffeinate >/dev/null 2>&1; then caffeinate -ims -w $$ & fi

echo 'Preflight: checking that Claude Code can work unattended here...'
rm -f PREFLIGHT_OK
out=$(claude -p 'Create a file named PREFLIGHT_OK in the current folder containing the word ok, using a shell command. Then reply with the single word ok.' "${FLAGS[@]}" </dev/null 2>&1)
if [ ! -f PREFLIGHT_OK ]; then
  echo 'CANNOT START: Claude Code could not run a command unattended. Its answer was:'
  echo "$out"
  exit 1
fi
rm -f PREFLIGHT_OK
echo 'STARTED. Leave this window open, the laptop plugged in and the lid open.'

short=0
i=0
while [ $i -lt 500 ]; do
  i=$((i+1))
  if [ -f DONE ] || [ -f STOP ]; then break; fi
  t0=$(date +%s)
  echo "--- run $i, $(date)"
  claude -p "$PROMPT" "${FLAGS[@]}" --output-format stream-json --verbose </dev/null 2>&1 | tee -a run.log
  secs=$(( $(date +%s) - t0 ))
  # A run that ends within two minutes did no real work (usually a usage limit). After three, wait half an hour.
  if [ "$secs" -lt 120 ]; then short=$((short+1)); else short=0; fi
  if [ "$short" -ge 3 ]; then sleep 1800; else sleep 30; fi
done

if [ -f DONE ]; then echo 'FINISHED. Open REPORT.md.'; cat DONE
elif [ -f STOP ]; then echo 'STOPPED. Reason:'; cat STOP
else echo 'Run limit reached. Start the script again to continue.'; fi
