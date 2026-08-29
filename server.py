import os, sqlite3, uuid, secrets, time
from flask import Flask, send_from_directory, request, session, redirect, jsonify, make_response
from flask_socketio import SocketIO, join_room, emit

app = Flask(__name__, static_folder="static", template_folder="templates")
app.secret_key = os.environ.get("SPIN_SECRET", "CHANGE_ME_BEFORE_PRODUCTION")
app.config.update(
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SAMESITE="Lax",
    SESSION_COOKIE_SECURE=os.environ.get("COOKIE_SECURE", "0") == "1",
)

ADMIN_USER = os.environ.get("ADMIN_USER", "owner")
ADMIN_PASS = os.environ.get("ADMIN_PASS", "CHANGE_ME")
DB = os.environ.get("DB_PATH", "spinwheel.db")

socketio = SocketIO(app, cors_allowed_origins="*", async_mode="threading")

# room_id -> {created, last_seen, admin_token, target}
rooms = {}
ROOM_TTL = 60 * 60 * 8

def db():
    c = sqlite3.connect(DB)
    c.row_factory = sqlite3.Row
    return c

def init_db():
    c = db()
    c.execute("""CREATE TABLE IF NOT EXISTS wheels(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        entries TEXT NOT NULL,
        settings TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )""")
    c.execute("""CREATE TABLE IF NOT EXISTS owner_events(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        room TEXT NOT NULL,
        target TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )""")
    c.commit()
    c.close()

def cleanup_rooms():
    now = time.time()
    for r in list(rooms):
        if now - rooms[r]["last_seen"] > ROOM_TTL:
            del rooms[r]

def player_room():
    cleanup_rooms()
    room = request.cookies.get("player_room")
    if not room or room not in rooms:
        room = uuid.uuid4().hex[:10].upper()
        rooms[room] = {
            "created": time.time(),
            "last_seen": time.time(),
            "admin_token": secrets.token_urlsafe(32),
            "target": None,
        }
    rooms[room]["last_seen"] = time.time()
    return room

init_db()

@app.get("/")
def home():
    room = player_room()
    resp = make_response(send_from_directory("static", "index.html"))
    resp.set_cookie("player_room", room, max_age=ROOM_TTL, httponly=True, samesite="Lax")
    return resp

@app.get("/admin-login")
def admin_login():
    return send_from_directory("templates", "admin-login.html")

@app.get("/admin")
def admin_page():
    if not session.get("admin"):
        return redirect("/admin-login")
    return send_from_directory("templates", "admin.html")

@app.get("/owner-control")
def owner_control():
    # This page itself is harmless without a valid one-time/session token.
    return send_from_directory("templates", "control.html")

@app.post("/api/login")
def login():
    data = request.get_json(silent=True) or {}
    username = str(data.get("username", ""))
    password = str(data.get("password", ""))
    if secrets.compare_digest(username, ADMIN_USER) and secrets.compare_digest(password, ADMIN_PASS):
        session.clear()
        session["admin"] = True
        return jsonify(ok=True)
    return jsonify(ok=False, message="Invalid username or password"), 401

@app.post("/api/logout")
def logout():
    session.clear()
    return jsonify(ok=True)

@app.get("/api/admin/stats")
def stats():
    if not session.get("admin"):
        return jsonify(error="Unauthorized"), 401
    cleanup_rooms()
    c = db()
    wheels = c.execute("SELECT COUNT(*) n FROM wheels").fetchone()["n"]
    events = c.execute("SELECT COUNT(*) n FROM owner_events").fetchone()["n"]
    c.close()
    return jsonify(wheels=wheels, events=events, active_rooms=len(rooms))

@app.get("/api/admin/rooms")
def active_rooms():
    if not session.get("admin"):
        return jsonify(error="Unauthorized"), 401
    cleanup_rooms()
    return jsonify([
        {"room": r, "created": rooms[r]["created"], "target": rooms[r]["target"] is not None}
        for r in rooms
    ])

@app.post("/api/admin/create-control")
def create_control():
    if not session.get("admin"):
        return jsonify(error="Unauthorized"), 401
    cleanup_rooms()
    room = str((request.get_json(silent=True) or {}).get("room", "")).upper()
    if room not in rooms:
        return jsonify(error="Public wheel session not found. Open the public wheel first."), 404
    # Reuse the room's private admin token. The token is returned only to the authenticated owner.
    token = rooms[room]["admin_token"]
    return jsonify(
        room=room,
        token=token,
        control_url=f"/owner-control?room={room}&token={token}"
    )

@app.post("/api/save-wheel")
def save_wheel():
    data = request.get_json(silent=True) or {}
    name = str(data.get("name") or "Untitled Wheel").strip()[:120]
    entries = data.get("entries") or []
    settings = data.get("settings") or {}
    c = db()
    cur = c.execute(
        "INSERT INTO wheels(name,entries,settings) VALUES(?,?,?)",
        (name, "\n".join(map(str, entries)), str(settings))
    )
    c.commit()
    wid = cur.lastrowid
    c.close()
    return jsonify(ok=True, id=wid)

@app.get("/api/admin/wheels")
def admin_wheels():
    if not session.get("admin"):
        return jsonify(error="Unauthorized"), 401
    c = db()
    rows = c.execute("SELECT * FROM wheels ORDER BY id DESC").fetchall()
    c.close()
    return jsonify([dict(r) for r in rows])

@app.delete("/api/admin/wheels/<int:wid>")
def delete_wheel(wid):
    if not session.get("admin"):
        return jsonify(error="Unauthorized"), 401
    c = db()
    c.execute("DELETE FROM wheels WHERE id=?", (wid,))
    c.commit()
    c.close()
    return jsonify(ok=True)

@app.get("/api/admin/events")
def admin_events():
    if not session.get("admin"):
        return jsonify(error="Unauthorized"), 401
    c = db()
    rows = c.execute("SELECT * FROM owner_events ORDER BY id DESC LIMIT 100").fetchall()
    c.close()
    return jsonify([dict(r) for r in rows])

@socketio.on("player_join")
def player_join(data=None):
    room = player_room()
    rooms[room]["last_seen"] = time.time()
    join_room(room)
    emit("player_ready", {"room": room})

@socketio.on("owner_join")
def owner_join(data):
    data = data or {}
    room = str(data.get("room", "")).upper()
    token = str(data.get("token", ""))
    if room not in rooms or not secrets.compare_digest(token, rooms[room]["admin_token"]):
        emit("control_error", {"message": "Unauthorized private control."})
        return
    join_room(room)
    emit("owner_ready", {"room": room})

@socketio.on("force_winner")
def force_winner(data):
    data = data or {}
    room = str(data.get("room", "")).upper()
    token = str(data.get("token", ""))
    target = str(data.get("target", "")).strip()
    if room not in rooms or not secrets.compare_digest(token, rooms[room]["admin_token"]):
        emit("control_error", {"message": "Unauthorized private control."})
        return
    if not target:
        emit("control_error", {"message": "Enter a target."})
        return
    rooms[room]["target"] = target
    rooms[room]["last_seen"] = time.time()
    c = db()
    c.execute("INSERT INTO owner_events(room,target) VALUES(?,?)", (room, target))
    c.commit()
    c.close()
    socketio.emit("remote_target", {"target": target}, room=room)

@socketio.on("clear_target")
def clear_target(data):
    data = data or {}
    room = str(data.get("room", "")).upper()
    token = str(data.get("token", ""))
    if room in rooms and secrets.compare_digest(token, rooms[room]["admin_token"]):
        rooms[room]["target"] = None
        socketio.emit("remote_target", {"target": None}, room=room)

if __name__ == "__main__":
    port = int(os.environ.get("PORT", "5000"))
    socketio.run(app, host="0.0.0.0", port=port, allow_unsafe_werkzeug=True)
