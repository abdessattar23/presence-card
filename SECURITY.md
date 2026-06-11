# Security & Privacy

Privacy isn't a feature of this project — it's the point. This document covers
both how the project protects you and how to report a problem.

## What the agent publishes

The desktop agent publishes a tiny, fixed-shape payload and nothing else:

```json
{ "activity": "coding", "editor": "Cursor", "media": { "title": "…", "artist": "…", "playing": true, "app": "Spotify" }, "ts": 1718100000 }
```

- **Published:** coarse activity (`coding` / `browsing` / `listening` / …), the
  app name, and the currently playing track + artist.
- **Never published:** window titles, file names, file paths, URLs, keystrokes,
  or any document contents. They are read locally only to classify activity and
  are immediately discarded.
- Set `PUBLISH_EDITOR = False` in the agent to suppress even the app name.
- Stop the agent and the card goes offline after ~90 seconds.

## Handling secrets

- Your Upstash credentials live in `presence.config.json` (gitignored) or in
  environment variables — **never in committed code**. Only
  `presence.config.example.json`, with placeholders, is tracked.
- The serverless endpoints read the token from Vercel environment variables.
  The token is never exposed to the browser; the public API only ever returns
  the presence payload above.
- If you ever commit a token by mistake, rotate it in the Upstash dashboard
  immediately — rotation invalidates the leaked one.

## Reporting a vulnerability

If you find a way the card or an agent could leak more than the payload above —
or any other security issue — please **do not open a public issue**. Email
**elyagoubiabdessattar@gmail.com** with details and steps to reproduce. You can
expect an acknowledgement within a few days.

Supported version: the latest release on `main`.
