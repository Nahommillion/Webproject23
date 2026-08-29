# SpinWheel — Final Styled + Ethiopian Languages

This version includes:

- Whole-page theme colour changes (not just the wheel).
- Background colour, gradient, pattern, and dots.
- Optional decorative background graphics.
- SpinWheel logo built into the interface.
- Spin duration from 1–30 seconds.
- Sound and confetti controls.
- English, Amharic, Afaan Oromoo, Tigrinya, Wolaytta, Somali, and Sidama UI translations.
- Language selector changes the visible interface labels/buttons.
- Owner target control remains invisible on the public wheel.
- Owner can target an exact existing number or name for the next spin.
- Private phone control remains available through `/owner-control`.

Deployment remains:

Build:
`pip install -r requirements.txt`

Start:
`gunicorn --worker-class gthread --threads 8 --workers 1 --bind 0.0.0.0:$PORT server:app`

Render environment variables:
- ADMIN_USER
- ADMIN_PASS
- SPIN_SECRET
- COOKIE_SECURE=1

Important:
The translated text for Ethiopian languages is intended for the basic website UI. For production/public release, native speakers should review terminology, especially Wolaytta and Sidama UI wording.
