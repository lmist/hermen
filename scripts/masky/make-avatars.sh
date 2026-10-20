#!/usr/bin/env bash
# Creates the Hermen + Herma Masky avatars, portraits, and public intro videos.
# Safe to re-run: reuses existing avatars/portraits/intros. Needs curl + python3.
# Usage: scripts/masky/make-avatars.sh [avatars]   ("avatars" skips intro videos)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
ENVF="${HERMEN_ENV:-/Users/lou/hermen/cloudflare.env}"
KEY="$(sed -n 's/^masky_api_key=//p' "$ENVF" | tr -d '[:space:]')"
[ -n "$KEY" ] || { echo "no masky key in $ENVF" >&2; exit 1; }
API=https://masky.ai/api
OUT="$ROOT/public/avatars.json"
mkdir -p "$ROOT/public/avatars"
[ -f "$OUT" ] || echo '{}' > "$OUT"

api() { # method path [json]
  curl -sS -X "$1" "$API$2" -H "Authorization: Bearer $KEY" -H "Content-Type: application/json" ${3:+-d "$3"}
}
py() { python3 -I -c "$@"; }

code=$(curl -s -o /dev/null -w '%{http_code}' "$API/avatars" -H "Authorization: Bearer $KEY")
[ "$code" = 200 ] || { echo "key check failed: $code" >&2; exit 1; }

AVATARS="$(api GET /avatars)"
VOICES="$(api GET /voices)"

PROMPT_HERMEN="Photorealistic head-and-shoulders portrait of a kind man about 40 with Mediterranean features, facing the camera, gentle real smile, kind slightly tired eyes, short dark hair greying at the temples, short neat beard, oatmeal knit sweater, small silver wing-shaped pin on the sweater, warm late-afternoon window light, soft plain warm-beige background, shallow depth of field, 85mm, natural skin texture, calm and trustworthy, not a doctor, no text."
PROMPT_HERMA="Photorealistic head-and-shoulders portrait of a warm woman about 40 with Mediterranean features, facing the camera, attentive kind eyes, soft small smile, dark curly hair loosely tied back with a few loose strands, sage-green cardigan, small gold hoop earrings, small silver wing-shaped pin, warm late-afternoon window light, soft plain warm-beige background, shallow depth of field, 85mm, natural skin texture, calm and trustworthy, not a doctor, no text."
PERSONA="You are %s, a warm prep companion who helps people get ready for a therapy session. Use plain words and short replies, one question at a time. Reflect back what you heard (\"Here's what I heard...\"). Gently flag words a therapist could misread. Never diagnose, never give treatment, never replace a therapist. If someone may be in danger, point to a crisis line: 988 (US), 116 123 (Samaritans UK/IE), findahelpline.com."
INTRO_HERMEN="Hi, I'm Hermen. Before your next session, let's find the words together. Messy is fine. Then we'll check that what you say is what you mean."
INTRO_HERMA="Hi, I'm Herma. Therapy goes better when you've already found some of the words. Let's practice, so you walk in ready to be understood."
VOICE_HERMEN="Comforting Male Conversationalist"
VOICE_HERMA="Warm Female Assistant Voice"

# state helpers on public/avatars.json
jget() { py 'import json,sys;d=json.load(open(sys.argv[1])).get(sys.argv[2],{});v=d.get(sys.argv[3],"");print(json.dumps(v) if isinstance(v,(list,dict)) else v)' "$OUT" "$1" "$2"; }
jset() { py 'import json,sys;f,k,fld,v=sys.argv[1:5];d=json.load(open(f));d.setdefault(k,{})[fld]=json.loads(v);open(f,"w").write(json.dumps(d,indent=2)+"\n")' "$OUT" "$1" "$2" "$3"; }

make_one() { # key Name PORTRAIT_PROMPT VOICE_NAME
  local k="$1" name="$2" pprompt="$3" vname="$4"
  local img="$ROOT/public/avatars/$k.jpg"

  local murl; murl="$(jget "$k" maskyImageUrl)"
  if [ -z "$murl" ] || [ ! -f "$img" ]; then
    local pbody; pbody=$(py 'import json,sys;print(json.dumps({"prompt":sys.argv[1],"aspectRatio":"1:1","model":"default"}))' "$pprompt")
    murl=$(api POST /images/generate "$pbody" | py 'import json,sys;print(json.load(sys.stdin)["imageUrl"])')
    curl -sS -L "$murl" -o "$img"
    file "$img" | grep -qi image || { echo "$img is not an image" >&2; exit 1; }
  fi

  local ids; ids=$(printf '%s' "$AVATARS" | py 'import json,sys
n=sys.argv[1]
for a in json.load(sys.stdin)["avatars"]:
    if a.get("displayName")==n: print(a["avatarId"],a["avatarOwnerUserId"]); break' "$name")
  local voiceId; voiceId=$(printf '%s' "$VOICES" | py 'import json,sys
n=sys.argv[1]
for v in json.load(sys.stdin)["voices"]:
    if v["name"]==n: print(v["id"]); break' "$vname")
  [ -n "$voiceId" ] || { echo "voice $vname not found" >&2; exit 1; }
  if [ -z "$ids" ]; then
    local persona; persona=$(printf "$PERSONA" "$name")
    local abody; abody=$(py 'import json,sys;print(json.dumps({"displayName":sys.argv[1],"imageUrl":sys.argv[2],"personalityPrompt":sys.argv[3],"voiceId":sys.argv[4]}))' "$name" "$murl" "$persona" "$voiceId")
    local resp; resp=$(api POST /avatars "$abody")
    ids=$(printf '%s' "$resp" | py 'import json,sys
d=json.load(sys.stdin)
a=d.get("avatar")
if not a: sys.stderr.write(json.dumps(d)+"\n"); sys.exit(1)
print(a["avatarId"],a["avatarOwnerUserId"])') || { echo "avatar creation failed (free tier? redeem https://masky.ai/?membership=true coupon AIWORKFORCE2026)" >&2; exit 2; }
  fi
  local aid=${ids% *} owner=${ids#* }
  jset "$k" name "\"$name\""
  jset "$k" avatarId "\"$aid\""
  jset "$k" avatarOwnerUserId "\"$owner\""
  jset "$k" voiceId "\"$voiceId\""
  jset "$k" imageUrl "\"/avatars/$k.jpg\""
  jset "$k" maskyImageUrl "\"$murl\""
  echo "$name avatar $aid ready"
}

intro_one() { # key intro
  local k="$1" intro="$2"
  local have; have="$(jget "$k" introTurns)"
  if [ -n "$have" ] && [ "$have" != "[]" ]; then echo "$k intro already done"; return; fi
  local aid owner; aid=$(jget "$k" avatarId); owner=$(jget "$k" avatarOwnerUserId)
  local conv; conv=$(api POST /conversations "$(printf '{"avatarOwnerUserId":"%s","avatarId":"%s"}' "$owner" "$aid")")
  local cid slug
  cid=$(printf '%s' "$conv" | py 'import json,sys;print(json.load(sys.stdin)["conversationId"])')
  slug=$(printf '%s' "$conv" | py 'import json,sys;print(json.load(sys.stdin)["shareSlug"])')
  local live; live=$(api POST "/conversations/$cid/visibility" '{"isPublic":true}' | py 'import json,sys;print(json.load(sys.stdin)["liveUrl"])')
  local tbody; tbody=$(py 'import json,sys;print(json.dumps({"userText":sys.argv[1],"mode":"speak","output":"video","voiceStyle":{"emotion":"contentment","prosody":["speed_slow"]}}))' "$intro")
  api POST "/conversations/$cid/turn" "$tbody" >/dev/null
  local i turns=""
  for i in $(seq 1 80); do
    sleep 3
    turns=$(api GET "/conversations/by-slug/$slug" | py 'import json,sys
d=json.load(sys.stdin)
t=[x for x in d.get("turns",[]) if x.get("role")=="avatar"]
if any(x.get("status")=="error" for x in t): print("ERROR"); sys.exit()
if t and all(x.get("videoUrl") for x in t):
    print(json.dumps([{"liveUrl":x.get("liveUrl"),"shareUrl":x.get("shareUrl")} for x in t]))')
    [ -n "$turns" ] && break
  done
  if [ -z "$turns" ] || [ "$turns" = ERROR ]; then echo "$k intro failed or timed out (conversation $cid)" >&2; return 1; fi
  jset "$k" introLiveUrl "\"$live\""
  jset "$k" introTurns "$turns"
  echo "$k intro ready: $live"
}

make_one hermen Hermen "$PROMPT_HERMEN" "$VOICE_HERMEN"
make_one herma  Herma  "$PROMPT_HERMA"  "$VOICE_HERMA"
[ "${1:-all}" = avatars ] && exit 0
intro_one hermen "$INTRO_HERMEN"
intro_one herma  "$INTRO_HERMA"
