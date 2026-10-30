# -*- coding: utf-8 -*-
"""
devserver.py  開発用のサーバー（v1.0.2。ゲーム本体ではない）

  python my-first-app/tools/devserver.py 8124

▼ ふつうのサーバー（8123）との違い
  ・番号（ポート）が違うので、ブラウザのセーブ（localStorage）も別になる。
    ここで何をしても、ふだん遊んでいるセーブ（8123）には届かない。
  ・最初のページが開発用の目次（dev.html）。
  ・動きの見本（motion-viewer.html）で調整した動きを、data/motions.js へ保存できる。
  ・表の編集（table-editor.html）で直した数字を、data/ の決まったファイル（TABLES）へ書ける。
  ・効果音の一覧・データの点検に、assets/audio/ のファイルの一覧を渡す。

▼ 書き込む場所は決めたところだけ
  data/motions.js のいちばん下にある「調整ページが書くところ」（MARK_START〜MARK_END の間）だけを書き換える。
  表の編集は、TABLES のファイルの「1行に1つの数字」の数字の部分だけを書き換える（parse_table の説明）。
  ほかの行と注意書きには触らない。書く前に毎回、その時点の写しを backup/ に日時つきで残す（ファイルごとに新しい方から 40 個）。

▼ 外からは書き換えられない
  ・このパソコンの中（127.0.0.1）でしか待ち受けない。
  ・保存の頼みは、このサーバー自身のページからしか受けない（Host / Origin を確かめ、決まった見出しが無ければ断る）。
  ・受け取るのは動きの id と数字・決まった文字だけ。JSON に直して書くので、命令の文が紛れ込むことはない。

Python の標準の部品だけで動く（入れるものは無い）。
"""
import json
import os
import re
import shutil
import sys
import time
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, urlparse

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))   # my-first-app
MOTIONS = os.path.join(ROOT, "data", "motions.js")
AUDIO_DIR = os.path.join(ROOT, "assets", "audio")
BACKUP = os.path.join(ROOT, "backup")
KEEP_BACKUPS = 40
MAX_BODY = 512 * 1024

MARK_START = "// ▼▼▼ 動きの調整ページが書くところ"
MARK_END = "// ▲▲▲ 動きの調整ページが書くところ（ここまで）"

# 表の編集（table-editor.html）で書き換えてよいファイル。名前 → data/ のファイル
# ★ ここに無いファイルは、表の編集からは読みも書きもしない
TABLES = {
    "monsters":  "monsters.js",
    "items":     "items.js",
    "skills":    "skills.js",
    "bosses":    "bosses.js",
    "abilities": "abilities.js",
    "blessings": "blessings.js",
    "recipes":   "recipes.js",
    "dungeons":  "dungeons.js",
    "audio":     "audio.js",       # 効果音の一覧（sound-list.html）が音量を書く
}
# 写しを残すファイル。写しの名前の頭 → ファイル
BACKUP_FILES = dict({"motions": MOTIONS}, **{k: os.path.join(ROOT, "data", v) for k, v in TABLES.items()})

ID_RE = re.compile(r"^[A-Za-z][A-Za-z0-9_]{0,47}$")
BACKUP_RE = re.compile(r"^(%s)-\d{8}-\d{6}(-\d+)?\.js$" % "|".join(BACKUP_FILES))
# 文字として受け取ってよい値（wave / shape / anchor / pose の名前など）
TEXT_RE = re.compile(r"^[A-Za-z0-9_]{0,40}$")


class Refused(Exception):
    pass


# --- 受け取った動きを確かめる ---

def check_value(value, depth=0):
    """数字・真偽・短い名前・それらの入れ物だけを通す"""
    if depth > 5:
        raise Refused("入れ子が深すぎる")
    if value is None or isinstance(value, bool):
        return value
    if isinstance(value, (int, float)):
        if value != value or value in (float("inf"), float("-inf")) or abs(value) > 1e6:
            raise Refused("数字がおかしい")
        return value
    if isinstance(value, str):
        if not TEXT_RE.match(value):
            raise Refused("使えない文字: " + value[:20])
        return value
    if isinstance(value, list):
        if len(value) > 64:
            raise Refused("並びが長すぎる")
        return [check_value(v, depth + 1) for v in value]
    if isinstance(value, dict):
        if len(value) > 40:
            raise Refused("項目が多すぎる")
        out = {}
        for k, v in value.items():
            if not isinstance(k, str) or not ID_RE.match(k):
                raise Refused("使えない項目名: " + str(k)[:20])
            out[k] = check_value(v, depth + 1)
        return out
    raise Refused("使えない値")


# --- data/motions.js の読み書き ---

def read_text(path):
    with open(path, "rb") as f:
        raw = f.read()
    bom = raw.startswith(b"\xef\xbb\xbf")
    text = raw.decode("utf-8-sig")
    newline = "\r\n" if "\r\n" in text else "\n"
    return text, bom, newline


def write_text(path, text, bom):
    tmp = path + ".tmp"
    with open(tmp, "wb") as f:
        f.write((b"\xef\xbb\xbf" if bom else b"") + text.encode("utf-8"))
    os.replace(tmp, path)


def block_of(text):
    """調整ページが書くところの、始まりと終わりの位置（無ければ None）"""
    start = text.find(MARK_START)
    end = text.find(MARK_END)
    if start < 0 or end < 0 or end < start:
        return None
    return start, end + len(MARK_END)


def tuned_of(text):
    """いま保存されている調整（{ id: 定義 }）"""
    span = block_of(text)
    if not span:
        raise Refused("data/motions.js に調整ページが書くところが無い")
    body = text[span[0]:span[1]]
    m = re.search(r"var tuned = (\{.*?\});\s*$", body, re.S | re.M)
    if not m:
        return {}
    return json.loads(m.group(1))


def render_block(tuned, newline):
    lines = [
        MARK_START + "。手で直さない（tools/devserver.py が丸ごと書き直す）▼▼▼",
        "  // 気に入った調整は、上の本体の行へ移してからここを消す。ここにある id は本体より優先される。",
        "  var tuned = " + json.dumps(tuned, ensure_ascii=False, indent=2, sort_keys=True).replace("\n", "\n  ") + ";",
        "  for (var tunedId in tuned) NS.rawData.motions[tunedId] = tuned[tunedId];",
        "  NS.rawData.motionsTuned = Object.keys(tuned);   // 見本ページで ★ を付ける",
        "  " + MARK_END,
    ]
    return newline.join(lines)


def backup_file(kind):
    """その時点のファイルを backup/ に写す（kind は BACKUP_FILES の名前）。ファイルごとに新しい方から 40 個残す"""
    os.makedirs(BACKUP, exist_ok=True)
    name = time.strftime(kind + "-%Y%m%d-%H%M%S")
    path = os.path.join(BACKUP, name + ".js")
    n = 1
    while os.path.exists(path):
        n += 1
        path = os.path.join(BACKUP, "%s-%d.js" % (name, n))
    shutil.copy2(BACKUP_FILES[kind], path)
    olds = sorted(f for f in os.listdir(BACKUP) if BACKUP_RE.match(f) and f.startswith(kind + "-"))
    for f in olds[:-KEEP_BACKUPS]:
        os.remove(os.path.join(BACKUP, f))
    return os.path.basename(path)


def backup_motions():
    return backup_file("motions")


def save_motion(motion_id, definition):
    """1件を保存する。definition が None なら、調整を消して本体の値に戻す"""
    if not ID_RE.match(motion_id or ""):
        raise Refused("動きの id が使えない形")
    if definition is not None:
        definition = check_value(definition)
        if not isinstance(definition, dict):
            raise Refused("動きの中身が無い")
    text, bom, newline = read_text(MOTIONS)
    tuned = tuned_of(text)
    if definition is None:
        tuned.pop(motion_id, None)
    else:
        tuned[motion_id] = definition
    span = block_of(text)
    new_text = text[:span[0]] + render_block(tuned, newline).lstrip() + text[span[1]:]
    saved = backup_motions()
    write_text(MOTIONS, new_text, bom)
    return {"ok": True, "backup": saved, "tuned": sorted(tuned.keys())}


def restore_backup(name):
    m = BACKUP_RE.match(name or "")
    if not m:
        raise Refused("写しの名前が使えない形")
    src = os.path.join(BACKUP, name)
    if not os.path.isfile(src):
        raise Refused("その写しは無い")
    kind = m.group(1)
    saved = backup_file(kind)   # 戻す前の状態も残しておく
    shutil.copy2(src, BACKUP_FILES[kind])
    return {"ok": True, "backup": saved}


def list_backups():
    if not os.path.isdir(BACKUP):
        return []
    # 新しい順（ファイルの種類をまたいで、日時で並べる）
    names = [f for f in os.listdir(BACKUP) if BACKUP_RE.match(f)]
    return sorted(names, key=lambda f: f.split("-", 1)[1], reverse=True)


def list_audio_files():
    if not os.path.isdir(AUDIO_DIR):
        return []
    return sorted(f for f in os.listdir(AUDIO_DIR) if os.path.isfile(os.path.join(AUDIO_DIR, f)))


# --- 表の編集（data/ の数字を、その場所だけ書き換える） ---
#
# NS.rawData.monsters = { … } の中を頭から読み、「名前: 数字」の数字をぜんぶ拾う。
# 入れ物の中は名前をつないで呼ぶ（入れ子でも、何行にまたがっていてもよい）。
#     slime: {
#       baseHp: 22,                                        → slime の「baseHp」
#       resistances: { water: 5, thunder: -2 },            → 「resistances.water」
#       growthRate: { hp: [{ from: 1, rate: 0.16 }, …] }   → 「growthRate.hp[0].rate」
#       equip: { effects: [
#         { type: "statBonus", stat: "attack", value: 2 }  → 「equip.effects[0].value」
# 文字の値・式（0.5 * 2 など）は拾わない（＝書き換えない）。
# 書き換えるのは数字の文字だけなので、注意書き（// …）や並び・空行はそのまま残る。

TOKEN_RE = re.compile(
    r"\s*(?:(?P<str>\"x*\"|'x*')"
    r"|(?P<num>-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)(?![\w.])"
    r"|(?P<ident>[A-Za-z_$][\w$]*)"
    r"|(?P<punct>[{}\[\]:,])"
    r"|(?P<other>\S))")
STRING_RE = re.compile(r"\"(?:[^\"\\]|\\.)*\"|'(?:[^'\\]|\\.)*'")
FIELD_PATH_RE = re.compile(r"^[A-Za-z_]\w*(?:\.\w+|\[\d+\])*$")


def table_path(name):
    if not isinstance(name, str) or name not in TABLES:
        raise Refused("その表は無い")
    return os.path.join(ROOT, "data", TABLES[name])


def code_lines(lines):
    """文字の中身を x に、注意書きを空白に置き換えた行。位置（何文字目か）は元の行と同じ"""
    out = []
    in_block = False
    for raw in lines:
        line = raw.rstrip("\r")
        masked = STRING_RE.sub(lambda s: s.group()[0] + "x" * (len(s.group()) - 2) + s.group()[-1], line)
        chars = list(masked)
        i = 0
        while i < len(chars):
            if in_block:
                j = masked.find("*/", i)
                end = len(chars) if j < 0 else j + 2
                chars[i:end] = " " * (end - i)
                if j < 0:
                    break
                in_block = False
                i = end
                continue
            a = masked.find("/*", i)
            c = masked.find("//", i)
            if c >= 0 and (a < 0 or c < a):
                chars[c:] = " " * (len(chars) - c)
                break
            if a < 0:
                break
            chars[a:a + 2] = "  "
            in_block = True
            i = a + 2
        out.append("".join(chars))
    return out


def join_path(keys):
    s = ""
    for k in keys:
        s += k if k.startswith("[") or not s else "." + k
    return s


def parse_table(text, name):
    """{ id: { "name": 表示名, "fields": { 項目: (行の番号, 始まり, 終わり, 書いてある文字) } } } と、項目の順番"""
    lines = text.split("\n")
    root = "NS.rawData.%s = " % name
    start = next((i for i, l in enumerate(lines) if l.strip().startswith(root)), None)
    if start is None:
        raise Refused("data/%s に %s が見つからない" % (TABLES[name], root))
    code = code_lines(lines)
    entries, order = {}, []
    stack = []          # [名前, 並びか, 並びの何番目まで来たか]
    pending = None      # 「名前:」を読んで、値を待っているときの名前
    parens = 0          # 関数の呼び出し（ivyAt(IVY_KAGE, 0.30) など）の中は読まない
    for i in range(start, len(lines)):
        pos = code[i].index(root) + len(root) if i == start else 0
        toks = list(TOKEN_RE.finditer(code[i], pos))
        for n, t in enumerate(toks):
            kind = t.lastgroup
            val = t.group(kind)
            nxt = toks[n + 1] if n + 1 < len(toks) else None
            if kind == "other" and val in "()":
                parens += 1 if val == "(" else -1
                continue
            if parens > 0 or kind == "other":
                continue
            if kind in ("ident", "num", "str") and nxt is not None and nxt.group(nxt.lastgroup) == ":":
                # 名前は 「hp:」 のほか 「1:」（階ごとの指定）や 「"1":」 もある
                pending = lines[i][t.start(kind) + 1:t.end(kind) - 1] if kind == "str" else val
                continue
            if kind == "punct" and val in ":,":
                continue
            in_array = bool(stack) and stack[-1][1]
            key = pending
            if key is None and in_array:
                key = "[%d]" % stack[-1][2]
                if val not in "}]":
                    stack[-1][2] += 1
            pending = None
            if kind == "punct" and val in "{[":
                stack.append([key, val == "[", 0])
                if len(stack) == 2:
                    entries.setdefault(key, {"name": "", "fields": {}, "span": [i, i]})
                continue
            if kind == "punct":                  # } か ]
                if not stack:
                    raise Refused("data/%s の %d 行目の閉じかっこが多い" % (TABLES[name], i + 1))
                if len(stack) == 2:
                    entries[stack[1][0]]["span"][1] = i
                stack.pop()
                if not stack:
                    return entries, order
                continue
            if len(stack) < 2 or key is None:
                continue
            entry = entries[stack[1][0]]
            if kind == "num":
                # 値が数字1つだけのときだけ（式の一部なら書き換えない）
                simple = "e" not in val.lower() and (nxt is None or nxt.group(nxt.lastgroup) in (",", "}", "]"))
                named = all(f[0] is not None and re.match(r"^(\w+|\[\d+\])$", f[0]) for f in stack[2:]) \
                    and re.match(r"^(\w+|\[\d+\])$", key)
                if simple and named:
                    path = join_path([f[0] for f in stack[2:]] + [key])
                    entry["fields"][path] = (i, t.start("num"), t.end("num"), val)
                    if path not in order:
                        order.append(path)
            elif kind == "str" and len(stack) == 2 and key in ("name", "title") and not entry["name"]:
                try:
                    entry["name"] = json.loads(lines[i][t.start("str"):t.end("str")])
                except ValueError:
                    pass
    raise Refused("data/%s の %s が閉じていない" % (TABLES[name], root))


def read_table(name):
    text, _bom, _nl = read_text(table_path(name))
    entries, order = parse_table(text, name)
    lines = text.split("\n")
    out = []
    for k, v in entries.items():
        by_line = {}
        for f, p in v["fields"].items():
            by_line.setdefault(p[0], []).append({"path": f, "start": p[1], "end": p[2]})
        out.append({
            "id": k, "name": v["name"],
            "values": {f: float(p[3]) if "." in p[3] else int(p[3]) for f, p in v["fields"].items()},
            # 1件ずつ見る画面のため。その1件の行ぜんぶと、行の中の数字の位置
            "lines": [{"n": n + 1, "text": lines[n].rstrip("\r"),
                       "fields": sorted(by_line.get(n, []), key=lambda x: x["start"])}
                      for n in range(v["span"][0], v["span"][1] + 1)],
        })
    return {"ok": True, "name": name, "file": "data/" + TABLES[name], "fields": order, "entries": out}


def format_number(value, old_text):
    """書いてあった形に合わせて書く（整数だった所に整数なら整数、小数が書いてあれば小数）"""
    if float(value).is_integer() and "." not in old_text:
        return str(int(value))
    s = ("%.6f" % value).rstrip("0")
    # 小数の桁は、書いてあった桁より減らさない（0.40 → 0.50 のまま。0.5 にしない）
    old_places = len(old_text.split(".")[1]) if "." in old_text else 1
    places = len(s.split(".")[1])
    return s + "0" * max(0, old_places - places)


def save_table(name, changes):
    if not isinstance(changes, list) or not changes or len(changes) > 500:
        raise Refused("変更の並びがおかしい")
    path = table_path(name)
    text, bom, _nl = read_text(path)
    entries, _order = parse_table(text, name)
    lines = text.split("\n")
    edits = []   # (行, 始まり, 終わり, 新しい文字)
    seen = set()
    for c in changes:
        if not isinstance(c, dict):
            raise Refused("変更の形がおかしい")
        entry_id, field = c.get("id"), c.get("field")
        if not isinstance(entry_id, str) or not ID_RE.match(entry_id):
            raise Refused("id が使えない形")
        if not isinstance(field, str) or len(field) > 120 or not FIELD_PATH_RE.match(field):
            raise Refused("項目の名前が使えない形")
        old, new = c.get("from"), c.get("to")
        for v in (old, new):
            if isinstance(v, bool) or not isinstance(v, (int, float)) or v != v or abs(v) > 1e6:
                raise Refused("数字がおかしい: %s.%s" % (entry_id, field))
        if (entry_id, field) in seen:
            raise Refused("%s の %s が2回ある" % (entry_id, field))
        seen.add((entry_id, field))
        place = entries.get(entry_id, {}).get("fields", {}).get(field)
        if not place:
            raise Refused("%s の %s は、この表では書き換えられない" % (entry_id, field))
        if abs(float(place[3]) - old) > 1e-9:
            raise Refused("%s の %s は、ほかで書き換わっている（いま %s）。表を読み直してください" % (entry_id, field, place[3]))
        edits.append((place[0], place[1], place[2], format_number(new, place[3])))
    # 同じ行に2つあるときは、右から書き換える（位置がずれないように）
    for line_no, s, e, new_text in sorted(edits, key=lambda x: (x[0], -x[1])):
        line = lines[line_no]
        lines[line_no] = line[:s] + new_text + line[e:]
    saved = backup_file(name)
    write_text(path, "\n".join(lines), bom)
    return {"ok": True, "backup": saved, "count": len(edits)}


# --- サーバー ---

class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def end_headers(self):
        # 古い絵や古いファイルが残らないよう、何も覚えさせない
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def log_message(self, fmt, *args):
        if self.path.startswith("/api/"):
            sys.stderr.write("[devserver] " + (fmt % args) + "\n")

    def _host_ok(self):
        port = self.server.server_address[1]
        allowed = {"localhost:%d" % port, "127.0.0.1:%d" % port}
        if self.headers.get("Host", "") not in allowed:
            return False
        origin = self.headers.get("Origin")
        if origin and origin not in {"http://" + h for h in allowed}:
            return False
        return True

    def _json(self, status, data):
        body = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        if self.path in ("/", "/index.html"):
            self.send_response(302)
            self.send_header("Location", "/dev.html")
            self.end_headers()
            return
        if self.path.startswith("/api/"):
            if not self._host_ok():
                return self._json(403, {"ok": False, "error": "このサーバーのページからだけ使える"})
            url = urlparse(self.path)
            if url.path == "/api/ping":
                return self._json(200, {"ok": True, "server": "devserver", "canSave": True})
            if url.path == "/api/backups":
                return self._json(200, {"ok": True, "backups": list_backups()})
            if url.path == "/api/audio-files":
                return self._json(200, {"ok": True, "files": list_audio_files()})
            if url.path == "/api/table":
                try:
                    name = (parse_qs(url.query).get("name") or [""])[0]
                    return self._json(200, read_table(name))
                except Refused as e:
                    return self._json(400, {"ok": False, "error": str(e)})
            return self._json(404, {"ok": False, "error": "無い"})
        return super().do_GET()

    def do_POST(self):
        if not self._host_ok() or self.headers.get("X-Dev-Tool") != "1":
            return self._json(403, {"ok": False, "error": "このサーバーのページからだけ保存できる"})
        try:
            length = int(self.headers.get("Content-Length", "0"))
            if length <= 0 or length > MAX_BODY:
                raise Refused("送られた中身の大きさがおかしい")
            data = json.loads(self.rfile.read(length).decode("utf-8"))
            if not isinstance(data, dict):
                raise Refused("送られた中身の形がおかしい")
            if self.path == "/api/motions/save":
                return self._json(200, save_motion(data.get("id"), data.get("definition")))
            if self.path == "/api/motions/restore" or self.path == "/api/restore":
                return self._json(200, restore_backup(data.get("name")))
            if self.path == "/api/table/save":
                return self._json(200, save_table(data.get("name"), data.get("changes")))
            return self._json(404, {"ok": False, "error": "無い"})
        except Refused as e:
            return self._json(400, {"ok": False, "error": str(e)})
        except (ValueError, KeyError) as e:
            return self._json(400, {"ok": False, "error": "送られた中身が読めない"})


def main():
    # Windows の窓は既定が Shift_JIS なので、文字化けしないよう UTF-8 で出す
    for stream in (sys.stdout, sys.stderr):
        try:
            stream.reconfigure(encoding="utf-8")
        except (AttributeError, ValueError):
            pass
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8124
    server = ThreadingHTTPServer(("127.0.0.1", port), Handler)
    print("開発用サーバー: http://localhost:%d/  （止めるときは Ctrl+C）" % port, flush=True)
    server.serve_forever()


if __name__ == "__main__":
    main()
