#!/bin/bash
set -euo pipefail
if ! git diff --cached -- prisma/schema.prisma | grep -qE '^[+-]'; then
  exit 0
fi
git show HEAD:prisma/schema.prisma > /tmp/schema-old.prisma
cp prisma/schema.prisma /tmp/schema-new.prisma
echo "=== Relation line counts (old vs new) ==="
grep -c '@relation' /tmp/schema-old.prisma /tmp/schema-new.prisma
echo "=== Relation diff ==="
git diff --cached -- prisma/schema.prisma | grep '@relation' || true
