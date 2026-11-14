#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
自建微信群活码系统 - 本地服务
功能：
  1. 落地页 /          展示当前「有效群二维码」（扫码进群）
  2. 后台 /admin        上传/管理多个群二维码、设置当前生效群、配置应用入口
  3. 自动切换            某个群扫码次数达到阈值(默认90，接近100人上限)自动跳到下一个未满群
  4. 统计               记录每个群的扫码次数

线下印刷用的「静态二维码」只需指向本页面地址（如 http://你的域名/），
群满后你到后台换张图即可，物料永远不用重印。
"""
import os
import json
import uuid
import threading
from datetime import datetime

from flask import (Flask, render_template, request, jsonify,
                   send_from_directory, abort, redirect, url_for)

BASE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(BASE, "data")
QR_DIR = os.path.join(BASE, "static", "qrcodes")
os.makedirs(DATA, exist_ok=True)
os.makedirs(QR_DIR, exist_ok=True)

GROUPS_FILE = os.path.join(DATA, "groups.json")
CONFIG_FILE = os.path.join(DATA, "config.json")

# 后台访问口令（演示用，部署前请改成你自己的复杂字符串）
ADMIN_TOKEN = os.environ.get("ADMIN_TOKEN", "huoma123")

DEFAULT_CONFIG = {
    "page_title": "扫码进群，一起玩",
    "page_subtitle": "长按识别二维码，加入我们的微信群",
    "app_url": "https://yourapp.com",
    "app_text": "打开网页应用",
    "welfare_url": "",
    "welfare_text": "扫码领新人福利",
    "auto_switch": True,
    "max_per_group": 90,   # 接近微信群100人上限时自动切换
}
DEFAULT_GROUPS = {"groups": [], "active_id": None}

lock = threading.Lock()


def load_json(path, default):
    if not os.path.exists(path):
        save_json(path, default)
        return json.loads(json.dumps(default))
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        save_json(path, default)
        return json.loads(json.dumps(default))


def save_json(path, data):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


app = Flask(__name__)


def _pick_next_active(groups, exclude_id=None):
    """选择一个未满的群作为生效群（按扫码数升序，尽量平均分配）。"""
    candidates = [g for g in groups["groups"]
                  if g["id"] != exclude_id and g.get("scans", 0) < g.get("max", 90)]
    if not candidates:
        candidates = groups["groups"]  # 全部满了也返回第一个，避免空页
    if not candidates:
        return None
    candidates.sort(key=lambda g: g.get("scans", 0))
    return candidates[0]["id"]


@app.route("/")
def index():
    config = load_json(CONFIG_FILE, DEFAULT_CONFIG)
    groups = load_json(GROUPS_FILE, DEFAULT_GROUPS)

    active = next((g for g in groups["groups"] if g["id"] == groups["active_id"]), None)

    # 自动切换：当前群达到阈值则切换
    if active and config.get("auto_switch", True):
        if active.get("scans", 0) >= config.get("max_per_group", 90):
            nxt = _pick_next_active(groups, exclude_id=active["id"])
            if nxt and nxt != groups["active_id"]:
                groups["active_id"] = nxt
                save_json(GROUPS_FILE, groups)
                active = next((g for g in groups["groups"] if g["id"] == nxt), None)

    # 记录一次扫码（用于统计与自动切换）
    if active:
        with lock:
            active["scans"] = active.get("scans", 0) + 1
            save_json(GROUPS_FILE, groups)

    return render_template("index.html", config=config, active=active,
                           now=datetime.now().strftime("%Y-%m-%d %H:%M"))


@app.route("/admin")
def admin():
    token = request.args.get("token", "")
    if token != ADMIN_TOKEN:
        return ("<h3>需要口令</h3><form method='get'><input name='token' placeholder='admin token'>"
                "<button>进入</button></form>"), 401
    config = load_json(CONFIG_FILE, DEFAULT_CONFIG)
    groups = load_json(GROUPS_FILE, DEFAULT_GROUPS)
    return render_template("admin.html", config=config, groups=groups,
                           token=token, active_id=groups["active_id"])


@app.route("/admin/config", methods=["POST"])
def admin_config():
    token = request.form.get("token", "")
    if token != ADMIN_TOKEN:
        return jsonify({"ok": False, "msg": "无权限"}), 403
    config = load_json(CONFIG_FILE, DEFAULT_CONFIG)
    for k in ["page_title", "page_subtitle", "app_url", "app_text",
              "welfare_url", "welfare_text"]:
        if k in request.form:
            config[k] = request.form[k]
    config["auto_switch"] = request.form.get("auto_switch") == "on"
    try:
        config["max_per_group"] = int(request.form.get("max_per_group", 90))
    except ValueError:
        pass
    save_json(CONFIG_FILE, config)
    return redirect(url_for("admin") + f"?token={token}")


@app.route("/admin/upload", methods=["POST"])
def admin_upload():
    token = request.form.get("token", "")
    if token != ADMIN_TOKEN:
        return jsonify({"ok": False, "msg": "无权限"}), 403
    f = request.files.get("file")
    name = request.form.get("name", "").strip() or "群"
    if not f or not f.filename:
        return jsonify({"ok": False, "msg": "未收到文件"}), 400
    ext = os.path.splitext(f.filename)[1].lower()
    if ext not in (".png", ".jpg", ".jpeg", ".webp", ".gif"):
        return jsonify({"ok": False, "msg": "仅支持图片格式"}), 400
    fid = uuid.uuid4().hex[:10]
    fname = fid + ext
    f.save(os.path.join(QR_DIR, fname))
    groups = load_json(GROUPS_FILE, DEFAULT_GROUPS)
    gid = uuid.uuid4().hex[:8]
    groups["groups"].append({
        "id": gid, "name": name, "file": fname,
        "scans": 0, "max": load_json(CONFIG_FILE, DEFAULT_CONFIG).get("max_per_group", 90),
        "created": datetime.now().strftime("%Y-%m-%d %H:%M"),
    })
    if not groups["active_id"]:
        groups["active_id"] = gid
    save_json(GROUPS_FILE, groups)
    return jsonify({"ok": True, "id": gid})


@app.route("/admin/set_active", methods=["POST"])
def admin_set_active():
    token = request.form.get("token", "")
    if token != ADMIN_TOKEN:
        return jsonify({"ok": False, "msg": "无权限"}), 403
    gid = request.form.get("id", "")
    groups = load_json(GROUPS_FILE, DEFAULT_GROUPS)
    if any(g["id"] == gid for g in groups["groups"]):
        groups["active_id"] = gid
        save_json(GROUPS_FILE, groups)
        return jsonify({"ok": True})
    return jsonify({"ok": False, "msg": "群不存在"}), 404


@app.route("/admin/delete", methods=["POST"])
def admin_delete():
    token = request.form.get("token", "")
    if token != ADMIN_TOKEN:
        return jsonify({"ok": False, "msg": "无权限"}), 403
    gid = request.form.get("id", "")
    groups = load_json(GROUPS_FILE, DEFAULT_GROUPS)
    groups["groups"] = [g for g in groups["groups"] if g["id"] != gid]
    if groups["active_id"] == gid:
        groups["active_id"] = groups["groups"][0]["id"] if groups["groups"] else None
    save_json(GROUPS_FILE, groups)
    return jsonify({"ok": True})


@app.route("/static/qrcodes/<path:name>")
def qrcode_file(name):
    return send_from_directory(QR_DIR, name)


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8080))
    print(f"活码系统已启动: http://localhost:{port}")
    print(f"后台地址: http://localhost:{port}/admin?token={ADMIN_TOKEN}")
    app.run(host="0.0.0.0", port=port, debug=False)
