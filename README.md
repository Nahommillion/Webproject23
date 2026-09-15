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

## V8 fixes
- Phone owner control can be opened directly and logged into from a phone.
- Public spins fetch the authoritative owner target before choosing a winner.
- Owner target matching supports exact text and numeric equivalence (for example 5 and 05).
- A missing owner target no longer silently falls back to a random winner.
- Winner rotation is calculated to put the winning segment midpoint exactly under the fixed pointer.
- Amharic winner announcements use an Amharic browser voice when available, with an Amharic Google TTS fallback.
- The Amharic announcement no longer overlaps the English-style fanfare.
