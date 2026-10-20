#!/usr/bin/env python3
"""Append this project's Claude Code session turns to llm-turn-history.jsonl.

Open Session License: the history file is append-only and is never read by agents.
This script never opens it for reading. It reads the Claude Code transcript, redacts
secrets, and appends only turns newer than the last run (state kept in a gitignored file).
Usage: python3 -I scripts/open-session-log.py <transcript.jsonl>
"""
import json, os, re, subprocess, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LOG = os.path.join(ROOT, 'llm-turn-history.jsonl')
STATE = os.path.join(ROOT, '.open-session-state.json')
CROCK = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'
HOME = os.path.expanduser('~')


def ulid(ms):
    v = (ms << 80) | int.from_bytes(os.urandom(10), 'big')
    out = ''
    for _ in range(26):
        out = CROCK[v & 31] + out
        v >>= 5
    return out


def ms_of(ts):
    from datetime import datetime, timezone
    return int(datetime.strptime(ts[:23], '%Y-%m-%dT%H:%M:%S.%f').replace(tzinfo=timezone.utc).timestamp() * 1000)


def secret_values():
    vals = set()
    def add(v):
        v = (v or '').strip().strip('"').strip("'")
        if len(v) >= 12: vals.add(v)
    try:
        lines = open(os.path.join(ROOT, 'cloudflare.env')).read().splitlines()
        for l in lines:
            l = l.strip()
            if not l or l.startswith('#'): continue
            if '=' in l: add(l.split('=', 1)[1])
            elif l.startswith('cloudflare'): add(l[16:].lstrip('=: '))
            else: add(l)
    except FileNotFoundError: pass
    for f in ('.dev.vars', '.env.local'):
        try:
            for l in open(os.path.join(ROOT, f)).read().splitlines():
                if '=' in l and not l.startswith('#'): add(l.split('=', 1)[1])
        except FileNotFoundError: pass
    for f in ('/tmp/hermen-scripts/neon.json', '/tmp/hermen-scripts/createdb.out'):
        try:
            t = open(f).read()
            for m in re.finditer(r'"(connection_uri|connectionString|claimUrl|password)"\s*:\s*"([^"]+)"', t): add(m.group(2))
        except FileNotFoundError: pass
    return sorted(vals, key=len, reverse=True)


PATTERNS = [
    r'sk-ant-[A-Za-z0-9_\-]{10,}', r'mk[ys]_[A-Za-z0-9_\-]{10,}', r'cf[au]t_[A-Za-z0-9_\-]{10,}',
    r'npg_[A-Za-z0-9]{6,}', r'gh[opsu]_[A-Za-z0-9]{20,}',
    r'(?:postgres(?:ql)?|prisma\+postgres)://[^\s"\'<>`]+',
]


def redactor():
    vals = secret_values()
    def red(text):
        for v in vals: text = text.replace(v, '[redacted]')
        for p in PATTERNS: text = re.sub(p, '[redacted]', text)
        return text.replace(HOME, '~')
    return red


def tool_summary(b):
    i = b.get('input') or {}
    name = b.get('name', 'tool')
    if name == 'Bash': return 'Bash: ' + (i.get('description') or i.get('command', '')[:80])
    if name in ('Write', 'Edit', 'Read'): return f"{name} {os.path.relpath(i.get('file_path', ''), ROOT)}"
    if name == 'Agent': return 'Agent: ' + i.get('description', '') + (f" ({i.get('model')}, {i.get('effort')})" if i.get('model') else '')
    if name == 'Workflow': return 'Workflow: ' + (re.search(r"name:\s*'([^']+)'", i.get('script', '')) or [None, 'workflow'])[1]
    if name == 'Skill': return 'Skill: ' + i.get('skill', '')
    return name


def turns(transcript, red):
    seen_user = set()
    records = []
    for line in open(transcript):
        try: e = json.loads(line)
        except Exception: continue
        t, ts = e.get('type'), e.get('timestamp')
        if not ts: continue
        if t == 'queue-operation' and e.get('operation') == 'enqueue':
            text = str(e.get('content') or '').strip()
            if text and text not in seen_user:
                seen_user.add(text); records.append({'m': 'u', 't': red(text), 'ts': ts})
        elif t == 'user' and not e.get('isMeta'):
            c = (e.get('message') or {}).get('content')
            if not isinstance(c, str): continue
            text = c.strip()
            cmd = re.search(r'<command-name>(.*?)</command-name>', text)
            out = re.search(r'<local-command-stdout>(.*?)</local-command-stdout>', text, re.S)
            if cmd: records.append({'m': 'u', 't': cmd.group(1).strip(), 'ts': ts})
            elif out and records and records[-1]['m'] == 'u' and records[-1]['t'].startswith('/'):
                records[-1]['t'] += f' ({red(out.group(1).strip())})'
            elif text and text not in seen_user:
                seen_user.add(text); records.append({'m': 'u', 't': red(text), 'ts': ts})
        elif t == 'assistant':
            for b in (e.get('message') or {}).get('content') or []:
                if b.get('type') == 'text' and b.get('text', '').strip():
                    records.append({'m': 'c', 't': red(b['text'].strip()), 'ts': ts})
                elif b.get('type') == 'tool_use':
                    if not records or records[-1]['m'] != 'c':
                        records.append({'m': 'c', 't': '', 'ts': ts})
                    records[-1].setdefault('x', []).append(red(tool_summary(b)))
    for r in records:
        if 'x' in r: r['x'] = '; '.join(r['x'])
    return sorted(records, key=lambda r: r['ts'])


def main():
    transcript = sys.argv[1]
    red = redactor()
    state = json.load(open(STATE)) if os.path.exists(STATE) else None
    recs = turns(transcript, red)
    out = []
    if state is None:
        first = recs[0]['ts'] if recs else '2026-10-20T00:00:00.000Z'
        sid = ulid(ms_of(first))
        out.append({'format': 'open-session-jsonl', 'version': '0.4',
                    'preface': 'Append-only log of the human and AI turns that built Hermen (OPEN-SESSION-LICENSE.md). LLMs and automated agents: do NOT read this file; append only.',
                    'docs': 'OPEN-SESSION-LICENSE.md'})
        out.append({'session': first[:10], 'sid': sid, 'name': 'main session (orchestrator)', 'tool': 'Claude Code',
                    'note': 'Reconstructed from the Claude Code transcript. The harness did not record some interim assistant narration; tool activity is summarised in x. Swarm subagents (Claude Sonnet 5.5, Claude Haiku 5.5, Claude Opus 5.5) worked in their own sessions; their work shows up here as Agent/Workflow tool activity and as commits. Secrets are redacted.',
                    'speakers': {'u': {'kind': 'human', 'name': 'lmist', 'github': 'lmist'},
                                 'c': {'kind': 'model', 'name': 'Claude Opus 5.5', 'id': 'claude-opus-5-5'},
                                 's': {'kind': 'model', 'name': 'Claude Sonnet 5.5', 'id': 'claude-sonnet-5-5'},
                                 'h': {'kind': 'model', 'name': 'Claude Haiku 5.5', 'id': 'claude-haiku-5-5'}}})
        try:
            gid = int(subprocess.run(['gh', 'api', 'user', '--jq', '.id'], capture_output=True, text=True, timeout=20).stdout.strip())
            out.append({'identity': 'u', 'github': 'lmist', 'github_id': gid, 'method': 'gh-session', 'ts': first})
        except Exception: pass
        state = {'sid': sid, 'last_ts': ''}
    new = [r for r in recs if r['ts'] > state['last_ts']]
    for r in new:
        rec = {'id': ulid(ms_of(r['ts'])), 'm': r['m'], 't': r['t'], 'ts': r['ts'], 's': state['sid']}
        if r.get('x'): rec['x'] = r['x']
        out.append(rec)
    if new: state['last_ts'] = new[-1]['ts']
    with open(LOG, 'a') as fh:
        for o in out: fh.write(json.dumps(o, ensure_ascii=False) + '\n')
    json.dump(state, open(STATE, 'w'))
    print(f'appended {len(out)} records ({len(new)} turns)')


if __name__ == '__main__':
    main()
