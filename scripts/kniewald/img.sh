#!/bin/sh
# usage: img.sh <ed> <leaf>...   downloads page scans once into data/raw/kniewald/img<ed>/n<leaf>.jpg
ed=$1; shift
d=data/raw/kniewald/img$ed   # run from the project folder; mkdir -p $d
for n in "$@"; do
  [ -s $d/n$n.jpg ] || { curl -sL "https://archive.org/download/rimski_misal_za_privatnu_upotrebu_$ed-dragutin_kniewald/page/n$n.jpg" -o $d/n$n.jpg; sleep 1; }
  ls -la $d/n$n.jpg | awk '{print $5, $9}'
done
