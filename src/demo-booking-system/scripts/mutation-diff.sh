#!/usr/bin/env bash
# Run Stryker on just the production files changed since origin/main.
# Used as the PR gate: fast enough to fail CI when a PR introduces
# a surviving mutant in its own diff.
set -euo pipefail

BASE_REF="${BASE_REF:-origin/main}"
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REPO_ROOT="$(cd "${PROJECT_DIR}" && git rev-parse --show-toplevel)"
PROJECT_REL="${PROJECT_DIR#${REPO_ROOT}/}"

cd "${REPO_ROOT}"

CHANGED=$(
  git diff --name-only --diff-filter=ACMR "${BASE_REF}...HEAD" -- \
    "${PROJECT_REL}/**/*.ts" "${PROJECT_REL}/**/*.tsx" \
  | grep -Ev '\.test\.|\.mirror\.test\.|\.stories\.|\.d\.ts$|/test/|/types/|/(api|web)/main\.(ts|tsx)$' \
  || true
)

if [ -z "${CHANGED}" ]; then
  echo "mutation:diff — no production files changed vs ${BASE_REF}, skipping."
  exit 0
fi

MUTATE_GLOB=$(echo "${CHANGED}" | paste -sd, -)

echo "mutation:diff — mutating:"
echo "${CHANGED}" | sed 's/^/  - /'
echo

exec pnpm exec stryker run src/demo-booking-system/stryker.conf.mjs --mutate "${MUTATE_GLOB}"
