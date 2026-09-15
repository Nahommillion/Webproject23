# SpinWheel V9

This version keeps the existing public SpinWheel and private owner admin/phone controller.

## Owner control
- Public owner admin: `/admin`
- Owner login defaults (if Render environment variables are not set): username `nahom`, password `strongpassword`
- If `ADMIN_USER` and `ADMIN_PASS` are already configured in Render, those values continue to take priority.
- The owner can use the existing Admin panel to generate the private phone control link and set **MAKE THIS WIN**.
- The target is authoritative for the next spin and the selected entry is placed exactly under the pointer.

## Game updates
- Full-screen game shows the entries currently playing.
- Main game keeps winner, wheel spins, hours of spinning and last winner in the side panel.
- Added continuous wheel-rumble sound and segment tick sounds during spinning.
- Long spin durations keep a fast, natural wheel speed instead of crawling; the configured time mainly controls how long the fast spin lasts before deceleration.
- Existing Amharic winner announcement and localization are retained.
