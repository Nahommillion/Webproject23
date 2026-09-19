import os, sqlite3, secrets, time
from flask import Flask, send_from_directory, request, session, redirect, jsonify
from flask_socketio import SocketIO, emit
from datetime import datetime
from zoneinfo import ZoneInfo

app=Flask(__name__,static_folder="static",template_folder="templates")
app.secret_key=os.environ.get("SPIN_SECRET","CHANGE_THIS_SECRET")
ADMIN_USER=os.environ.get("ADMIN_USER","nahom")
ADMIN_PASS=os.environ.get("ADMIN_PASS","strongpassword")
DB_PATH=os.environ.get("DB_PATH","spinwheel.db")
app.config.update(SESSION_COOKIE_HTTPONLY=True,SESSION_COOKIE_SAMESITE="Lax",
                  SESSION_COOKIE_SECURE=os.environ.get("COOKIE_SECURE","0")=="1")
socketio=SocketIO(app,cors_allowed_origins="*",async_mode="threading")
state={"target":None,"token":secrets.token_urlsafe(32)}

def db():
    c=sqlite3.connect(DB_PATH); c.row_factory=sqlite3.Row; return c
def init():
    c=db()
    c.execute("CREATE TABLE IF NOT EXISTS owner_events(id INTEGER PRIMARY KEY AUTOINCREMENT,target TEXT,created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)")
    c.execute("CREATE TABLE IF NOT EXISTS wheels(id INTEGER PRIMARY KEY AUTOINCREMENT,name TEXT,entries TEXT,settings TEXT,created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)")
    c.execute("CREATE TABLE IF NOT EXISTS daily_plays(play_date TEXT PRIMARY KEY, total_plays INTEGER NOT NULL DEFAULT 0, total_bet REAL NOT NULL DEFAULT 0, total_win REAL NOT NULL DEFAULT 0, total_seconds REAL NOT NULL DEFAULT 0, last_play_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)")
    # Upgrade databases created by older versions.
    cols={r[1] for r in c.execute("PRAGMA table_info(daily_plays)").fetchall()}
    if "total_bet" not in cols: c.execute("ALTER TABLE daily_plays ADD COLUMN total_bet REAL NOT NULL DEFAULT 0")
    if "total_win" not in cols: c.execute("ALTER TABLE daily_plays ADD COLUMN total_win REAL NOT NULL DEFAULT 0")
    if "total_seconds" not in cols: c.execute("ALTER TABLE daily_plays ADD COLUMN total_seconds REAL NOT NULL DEFAULT 0")
    c.execute("CREATE TABLE IF NOT EXISTS play_transactions(id INTEGER PRIMARY KEY AUTOINCREMENT, play_date TEXT NOT NULL, played_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, winner TEXT, total_bet REAL NOT NULL DEFAULT 0, total_win REAL NOT NULL DEFAULT 0, spin_seconds REAL NOT NULL DEFAULT 0, spin_number INTEGER NOT NULL DEFAULT 1)")
    pcols={r[1] for r in c.execute("PRAGMA table_info(play_transactions)").fetchall()}
    if "spin_seconds" not in pcols: c.execute("ALTER TABLE play_transactions ADD COLUMN spin_seconds REAL NOT NULL DEFAULT 0")
    if "spin_number" not in pcols: c.execute("ALTER TABLE play_transactions ADD COLUMN spin_number INTEGER NOT NULL DEFAULT 1")
    c.commit(); c.close()
init()

@app.get("/")
def home(): return send_from_directory("static","index.html")
@app.get("/admin-login")
def login_page(): return send_from_directory("templates","admin-login.html")
@app.get("/admin")
def admin_page():
    if not session.get("admin"): return redirect("/admin-login")
    resp=send_from_directory("templates","admin.html")
    resp.headers["Cache-Control"]="no-store, no-cache, must-revalidate, max-age=0"
    return resp
@app.get("/owner-control")
def control_page():
    # The page itself is safe to open without a token; control actions require
    # a valid token issued after owner login. This lets the owner log in directly
    # from a phone instead of depending on a copied private URL.
    return send_from_directory("templates","control.html")

@app.post("/api/login")
def login():
    d=request.get_json(silent=True) or {}
    if secrets.compare_digest(str(d.get("username","")),ADMIN_USER) and secrets.compare_digest(str(d.get("password","")),ADMIN_PASS):
        session["admin"]=True; return jsonify(ok=True)
    return jsonify(ok=False,message="Invalid username or password"),401
@app.post("/api/logout")
def logout(): session.clear(); return jsonify(ok=True)

@app.post("/api/phone-login")
def phone_login():
    d=request.get_json(silent=True) or {}
    if secrets.compare_digest(str(d.get("username","")),ADMIN_USER) and secrets.compare_digest(str(d.get("password","")),ADMIN_PASS):
        state["token"]=secrets.token_urlsafe(32)
        return jsonify(ok=True,control_url="/owner-control?token="+state["token"])
    return jsonify(ok=False,message="Invalid username or password"),401

@app.get("/api/target")
def get_target():
    return jsonify(target=state["target"])

@app.post("/api/target/clear")
def clear_target_api():
    state["target"]=None
    socketio.emit("target_changed",{"target":None})
    return jsonify(ok=True)

@app.post("/api/admin/new-control-link")
def new_link():
    if not session.get("admin"): return jsonify(error="Unauthorized"),401
    state["token"]=secrets.token_urlsafe(32)
    return jsonify(control_url="/owner-control?token="+state["token"])
@app.post("/api/play")
def record_play():
    # One completed wheel spin = one transaction. Store the total amount bet
    # across all entries and the winner's payout in Birr for the admin ledger.
    d=request.get_json(silent=True) or {}
    now=datetime.now(ZoneInfo("Africa/Addis_Ababa"))
    day=now.strftime("%Y-%m-%d")
    played_at=now.strftime("%Y-%m-%d %H:%M:%S")
    winner=str(d.get("winner","")).strip()
    try: total_bet=max(0.0,float(d.get("total_bet",0) or 0))
    except (TypeError,ValueError): total_bet=0.0
    try: total_win=max(0.0,float(d.get("total_win",0) or 0))
    except (TypeError,ValueError): total_win=0.0
    try: spin_seconds=max(0.0,float(d.get("spin_seconds",d.get("duration_seconds",0)) or 0))
    except (TypeError,ValueError): spin_seconds=0.0
    c=db()
    spin_number=int(c.execute("SELECT COALESCE(MAX(id),0)+1 FROM play_transactions").fetchone()[0])
    c.execute("INSERT INTO play_transactions(play_date,played_at,winner,total_bet,total_win,spin_seconds,spin_number) VALUES(?,?,?,?,?,?,?)",(day,played_at,winner,total_bet,total_win,spin_seconds,spin_number))
    c.execute("INSERT INTO daily_plays(play_date,total_plays,total_bet,total_win,total_seconds,last_play_at) VALUES(?,1,?,?,?,?) ON CONFLICT(play_date) DO UPDATE SET total_plays=total_plays+1,total_bet=total_bet+excluded.total_bet,total_win=total_win+excluded.total_win,total_seconds=total_seconds+excluded.total_seconds,last_play_at=excluded.last_play_at",(day,total_bet,total_win,spin_seconds,played_at))
    c.commit()
    row=c.execute("SELECT * FROM daily_plays WHERE play_date=?",(day,)).fetchone()
    overall=c.execute("SELECT COUNT(*) AS spins, COALESCE(SUM(spin_seconds),0) AS seconds FROM play_transactions").fetchone()
    c.close()
    return jsonify(ok=True,date=row["play_date"],total_plays=row["total_plays"],total_bet=row["total_bet"],total_win=row["total_win"],total_seconds=row["total_seconds"],spin_number=spin_number,overall_spins=overall["spins"],overall_seconds=overall["seconds"],last_play_at=row["last_play_at"])

@app.get("/api/admin/daily-plays")
def daily_plays():
    if not session.get("admin"): return jsonify(error="Unauthorized"),401
    c=db(); rows=c.execute("SELECT play_date,total_plays,total_bet,total_win,total_seconds,last_play_at FROM daily_plays ORDER BY play_date DESC LIMIT 365").fetchall(); c.close()
    return jsonify([dict(x) for x in rows])

@app.get("/api/admin/play-transactions")
def play_transactions():
    if not session.get("admin"): return jsonify(error="Unauthorized"),401
    c=db(); rows=c.execute("SELECT id,play_date,played_at,winner,total_bet,total_win,spin_seconds,spin_number FROM play_transactions ORDER BY id DESC LIMIT 500").fetchall(); c.close()
    return jsonify([dict(x) for x in rows])

@app.get("/api/admin/events")
def events():
    if not session.get("admin"): return jsonify(error="Unauthorized"),401
    c=db(); rows=c.execute("SELECT * FROM owner_events ORDER BY id DESC LIMIT 100").fetchall(); c.close()
    return jsonify([dict(x) for x in rows])

def auth(t): return bool(t) and secrets.compare_digest(t,state["token"])
@socketio.on("owner_join")
def owner_join(d):
    if not auth(str((d or {}).get("token",""))): emit("control_error",{"message":"Invalid private control link."}); return
    emit("owner_ready",{"target":state["target"]})
@socketio.on("set_target")
def set_target(d):
    d=d or {}; t=str(d.get("token","")); target=str(d.get("target","")).strip()
    if not auth(t): emit("control_error",{"message":"Unauthorized."}); return
    if not target: emit("control_error",{"message":"Enter a number or name."}); return
    state["target"]=target
    c=db(); c.execute("INSERT INTO owner_events(target) VALUES(?)",(target,)); c.commit(); c.close()
    socketio.emit("target_changed",{"target":target})
@socketio.on("clear_target")
def clear_target(d):
    if auth(str((d or {}).get("token",""))):
        state["target"]=None; socketio.emit("target_changed",{"target":None})

@app.post("/api/save-wheel")
def save_wheel():
    d=request.get_json(silent=True) or {}
    wheel_id=d.get("id")
    c=db()
    entries="\n".join(map(str,d.get("entries",[])))
    settings=str(d.get("settings",{}))
    if wheel_id:
        cur=c.execute("UPDATE wheels SET name=?, entries=?, settings=? WHERE id=?",(str(d.get("name","Untitled")),entries,settings,int(wheel_id)))
        if cur.rowcount:
            c.commit(); c.close(); return jsonify(ok=True,id=int(wheel_id),updated=True)
    cur=c.execute("INSERT INTO wheels(name,entries,settings) VALUES(?,?,?)",(str(d.get("name","Untitled")),entries,settings))
    c.commit(); i=cur.lastrowid; c.close(); return jsonify(ok=True,id=i)

@app.get("/api/wheel/<int:wheel_id>")
def get_wheel(wheel_id):
    c=db(); row=c.execute("SELECT * FROM wheels WHERE id=?",(wheel_id,)).fetchone(); c.close()
    if not row: return jsonify(ok=False),404
    return jsonify(ok=True,id=row["id"],name=row["name"],entries=row["entries"],settings=row["settings"])

if __name__=="__main__":
    socketio.run(app,host="0.0.0.0",port=int(os.environ.get("PORT","5000")),allow_unsafe_werkzeug=True)
