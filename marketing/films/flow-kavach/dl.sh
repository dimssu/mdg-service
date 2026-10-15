#!/bin/bash
# usage: dl.sh <outdir> then lines "name url" on stdin
out=$1; mkdir -p "$out"
while read -r name url; do [ -z "$name" ] && continue; curl -s -o "$out/$name" "$url" & done; wait
ls "$out" | wc -l
