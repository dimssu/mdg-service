#!/usr/bin/env bash
# Clone each per-service repo alongside this meta workspace so npm
# workspaces resolves `mdg-backend`, `mdg-admin`, `mdg-client`,
# `mdg-app`, and `shared` from a single tree.
set -euo pipefail

ORG="${MDG_GH_ORG:-mdg-services}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

for repo in mdg-backend mdg-admin mdg-client mdg-app; do
  if [ -d "$ROOT/$repo/.git" ]; then
    echo "[$repo] already cloned, pulling latest"
    git -C "$ROOT/$repo" pull --ff-only
  else
    echo "[$repo] cloning"
    git clone "https://github.com/$ORG/$repo.git" "$ROOT/$repo"
  fi
done

echo
echo "All services ready. Next:"
echo "  npm install"
echo "  npm run seed --workspace mdg-backend"
echo "  npm run dev"
