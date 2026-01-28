#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$repo_root"

echo "== Secret hygiene check =="

echo
echo "-- Checking tracked .env files (should only be examples) --"
python3 - <<'PY'
import re
import subprocess

tracked = subprocess.check_output(["git", "ls-files"], text=True).splitlines()

env_like = [p for p in tracked if re.search(r"(^|/)\.env(\.|$)", p)]
allowed = {
    "backend/.env.example",
    "backend/.env.production.example",
    "backend/.env.docker-compose.example",
}

unexpected = [p for p in env_like if p not in allowed]
print(f"Tracked .env-like files: {len(env_like)}")
for p in env_like:
    print(f" - {p}")

if unexpected:
    print("\nERROR: Unexpected tracked .env-like files found:")
    for p in unexpected:
        print(f" - {p}")
    raise SystemExit(1)
PY

echo
echo "-- Scanning for likely leaked secrets in tracked files --"

python3 - <<'PY'
import re
import subprocess

def run_git_grep(pattern: str):
    # -I: skip binary files
    # -n: include line numbers
    try:
        out = subprocess.check_output(["git", "grep", "-n", "-I", pattern, "--", "."], text=True)
        return out.splitlines()
    except subprocess.CalledProcessError:
        return []

def fail(title: str, lines: list[str]):
    print(f"ERROR: {title}")
    for line in lines:
        print(line)
    raise SystemExit(1)

# 1) Render deploy hooks: allow placeholders like srv-xxx?key=yyy, fail on anything else.
render_lines = run_git_grep(r"api\.render\.com/deploy/srv-")
suspect_render = []
for line in render_lines:
    if "srv-xxx" in line or "key=yyy" in line:
        continue
    suspect_render.append(line)
if suspect_render:
    fail("Potential real Render deploy hook URL(s) found in tracked files.", suspect_render)

# 2) Environment-style secret assignments outside known example templates.
assign_patterns = [
    r"SUPABASE_SERVICE_ROLE_KEY=",
    r"JWT_SECRET=",
    r"JWT_REFRESH_SECRET=",
]
assign_lines = []
for pat in assign_patterns:
    assign_lines.extend(run_git_grep(pat))

allowed_files = {
    "backend/.env.example",
    "backend/.env.production.example",
    "backend/.env.docker-compose.example",
}

def looks_like_placeholder(value: str) -> bool:
    v = value.strip().strip('"').strip("'")
    # Common placeholder conventions used across docs/examples in this repo.
    placeholder_markers = [
        "your-",
        "your_",
        "change-me",
        "change_this",
        "change-this",
        "CHANGE-THIS",
        "xxx",
        "yyy",
        "...",
        "[YOUR-",
        "<owner>",
        "<",
        "PASSWORD",
        "MIN-32-CHARS",
        "min-32-chars",
    ]
    return any(m in v for m in placeholder_markers)

suspect_assign = []
for line in assign_lines:
    path, rest = line.split(":", 1)
    if path in allowed_files:
        continue

    # rest is "<lineNo>:<content>"
    content = rest.split(":", 1)[1] if ":" in rest else rest
    if "=" in content:
        _, value = content.split("=", 1)
        if looks_like_placeholder(value):
            continue

    suspect_assign.append(line)

if suspect_assign:
    fail("Potential real secret value(s) found in tracked files.", suspect_assign)

print("OK: No likely leaked secrets found in tracked files.")
PY

