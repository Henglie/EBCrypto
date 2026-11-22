#!/bin/sh
# Source-distribution CLI wrapper; Node.js is required.
if ! command -v node >/dev/null 2>&1; then
  printf '%s\n' 'EBCrypto CLI requires Node.js on PATH.' >&2
  exit 2
fi
# Resolve PATH symlinks, including targets relative to the link's directory.
self=$0
hops=0
while [ -L "$self" ]; do
  hops=$((hops + 1))
  [ "$hops" -le 40 ] || { printf '%s\n' 'Too many symbolic links resolving EBCrypto CLI.' >&2; exit 2; }
  link=$(readlink -- "$self") || exit 2
  case "$link" in
    /*) self=$link ;;
    *) self=$(dirname -- "$self")/$link ;;
  esac
done
script_dir=$(CDPATH= cd -- "$(dirname -- "$self")" && pwd) || exit 2
exec node "$script_dir/../mcp/cli.mjs" "$@"
