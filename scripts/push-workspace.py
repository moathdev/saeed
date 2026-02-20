#!/usr/bin/env python3
"""
Auto-push workspace files to moathdev/saeed on GitHub via API.
Replaces sensitive tokens/IDs with token_xxxx before pushing.
"""
import os, re, json, base64, urllib.request, urllib.error

TOKEN = open("/root/.netrc").read().split("password")[-1].strip().split()[0]
REPO = "moathdev/saeed"
WORKSPACE = "/root/.openclaw/workspace"
HEADERS = {"Authorization": f"token {TOKEN}", "Content-Type": "application/json"}

REDACT_PATTERNS = [
    (r'ghp_[A-Za-z0-9]{36}', 'token_xxxx'),
    (r'\d{7,12}:[A-Za-z0-9_-]{30,}', 'token_xxxx'),   # Telegram bot tokens
    (r'966\d{9}(@c\.us)?', 'token_xxxx'),               # Saudi phone numbers
    (r'\b178374935\b', 'token_xxxx'),                    # Abu Sattam Telegram ID
    (r'\b274145062693109761\b', 'token_xxxx'),           # Discord ID
    (r'(password\s+)\S+', r'\1token_xxxx'),              # .netrc passwords
]

def redact(text):
    for pattern, replacement in REDACT_PATTERNS:
        text = re.sub(pattern, replacement, text)
    return text

def get_sha(path):
    try:
        req = urllib.request.Request(
            f"https://api.github.com/repos/{REPO}/contents/{path}",
            headers=HEADERS
        )
        return json.loads(urllib.request.urlopen(req).read()).get("sha")
    except:
        return None

def push_file(rel_path, content_str, msg="sync"):
    content_str = redact(content_str)
    sha = get_sha(rel_path)
    encoded = base64.b64encode(content_str.encode()).decode()
    data = {"message": msg, "content": encoded, "branch": "main"}
    if sha:
        data["sha"] = sha
    req = urllib.request.Request(
        f"https://api.github.com/repos/{REPO}/contents/{rel_path}",
        data=json.dumps(data).encode(),
        headers=HEADERS, method="PUT"
    )
    try:
        urllib.request.urlopen(req)
        print(f"✅ {rel_path}")
    except urllib.error.HTTPError as e:
        err = json.loads(e.read())
        print(f"❌ {rel_path}: {err.get('message','?')[:80]}")

# Core workspace files
for f in ["AGENTS.md", "HEARTBEAT.md", "IDENTITY.md", "MEMORY.md",
          "SOUL.md", "TOOLS.md", "USER.md"]:
    path = f"{WORKSPACE}/{f}"
    if os.path.exists(path):
        push_file(f, open(path).read(), f"sync: {f}")

# Scripts
scripts_dir = f"{WORKSPACE}/scripts"
for sf in os.listdir(scripts_dir):
    if sf.endswith((".js", ".sh", ".py")):
        push_file(f"scripts/{sf}", open(f"{scripts_dir}/{sf}").read(), f"sync: scripts/{sf}")

# Memory files
mem_dir = f"{WORKSPACE}/memory"
if os.path.isdir(mem_dir):
    for mf in sorted(os.listdir(mem_dir)):
        if mf.endswith(".md"):
            push_file(f"memory/{mf}", open(f"{mem_dir}/{mf}").read(), f"sync: memory/{mf}")

print("Done.")
