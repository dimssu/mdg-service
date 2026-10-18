#!/usr/bin/env bash
# Rebuilds everything after the takes exist (voice.mjs -> tighten.py -> words.mjs have run). usage: bash build-audio.sh
set -euo pipefail
cd "$(dirname "$0")"
python3 place.py        # gate the takes to digital silence outside the speech, place the lines, write script.json / script.js
python3 make-sfx.py >/dev/null
python3 make-bed.py
python3 cues.py >/dev/null
node ../../kit/audio/mix.mjs ..
python3 finish.py

python3 verify.py
