# SpinWheel — Final Deployment Version

## Project structure

```text
Webproject/
├── server.py
├── requirements.txt
├── render.yaml
├── Procfile
├── README.md
├── static/
│   ├── index.html
│   ├── app.js
│   └── style.css
└── templates/
    ├── admin-login.html
    ├── admin.html
    └── control.html
```

## What is public

The public homepage contains only the wheel/game interface.

There is no Admin button, Phone Control button, room code, target field, or owner-control information on the public page.

## Owner workflow

1. Open the public wheel in one browser/device.
2. Open `/admin-login` in the owner browser.
3. Log in.
4. In Owner Admin, refresh active public wheels.
5. Select the public wheel session you want to control.
6. Click **Create private phone link**.
7. Open that private link on the owner's phone.
8. Enter `5` and press **MAKE TARGET WIN**.
9. The public wheel receives the target silently.
10. The next spin lands on the matching existing entry.

The target must exist in the wheel. If `5` is not an entry, the wheel does not silently substitute another entry.

## Local run

Windows:

```powershell
py -m pip install -r requirements.txt
py server.py
```

Open:

```text
http://localhost:5000
```

Owner:

```text
http://localhost:5000/admin-login
```

## Render deployment

This repository includes `render.yaml`.

Recommended Render environment variables:

```text
ADMIN_USER = your-owner-username
ADMIN_PASS = a strong private password
SPIN_SECRET = a long random secret
COOKIE_SECURE = 1
```

Do not commit your real password or secret to GitHub.

## Important deployment note

This version uses one Gunicorn worker because the private owner-control rooms are held in server memory. This is suitable for a first deployment/testing instance. For a production multi-instance deployment, move room state and Socket.IO coordination to Redis and then enable multiple workers/instances.

## GitHub

Upload the contents of this folder to the root of your GitHub repository, replacing the old files.
