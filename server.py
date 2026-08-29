import os, sqlite3, secrets, time
from flask import Flask, send_from_directory, request, session, redirect, jsonify
from flask_socketio import SocketIO, emit

app=Flask(__name__,static_folder="static",template_folder="templates")
app.secret_key=os.environ.get("SPIN_SECRET","CHANGE_THIS_SECRET")
ADMIN_USER=os.environ.get("ADMIN_USER","owner")
ADMIN_PASS=os.environ.get("ADMIN_PASS","CHANGE_THIS_PASSWORD")
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
    c.commit(); c.close()
init()

@app.get("/")
def home(): return send_from_directory("static","index.html")
@app.get("/admin-login")
def login_page(): return send_from_directory("templates","admin-login.html")
@app.get("/admin")
def admin_page():
    return send_from_directory("templates","admin.html") if session.get("admin") else redirect("/admin-login")
@app.get("/owner-control")
def control_page():
    t=request.args.get("token","")
    return send_from_directory("templates","control.html") if t and secrets.compare_digest(t,state["token"]) else ("Invalid private control link.",403)

@app.post("/api/login")
def login():
    d=request.get_json(silent=True) or {}
    if secrets.compare_digest(str(d.get("username","")),ADMIN_USER) and secrets.compare_digest(str(d.get("password","")),ADMIN_PASS):
        session["admin"]=True; return jsonify(ok=True)
    return jsonify(ok=False,message="Invalid username or password"),401
@app.post("/api/logout")
def logout(): session.clear(); return jsonify(ok=True)
@app.post("/api/admin/new-control-link")
def new_link():
    if not session.get("admin"): return jsonify(error="Unauthorized"),401
    state["token"]=secrets.token_urlsafe(32)
    return jsonify(control_url="/owner-control?token="+state["token"])
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
