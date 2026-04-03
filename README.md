# AniTrack

## What was broken & what's fixed

### 1. Wrong backend port (most critical)

Your Express server runs on **port 3005** (in `index.js`: `const port = 3005`).
All files were pointing to `localhost:5000`. Every file now uses `localhost:3005`.

### 2. Context filename typo

Old: `AnimeConextProvider.jsx` (missing 't')
New: `AnimeContextProvider.jsx` — all imports updated.

### 3. Duplicate useEffect in WatchPage

WatchPage had TWO `useEffect` blocks both fetching the stream URL.
They conflicted and overwrote each other. Now there is **one** clean effect per concern.

### 4. White gap / white bar

The `<main>` had `paddingTop: "68px"` but navbar is 62px tall.
Layout.jsx is now fixed to match exactly.

### 5. WatchPage stream flow

Fixed to follow the exact Aniwatch API docs:

- `/api/search/:title/1` → get `idanime`
- `/api/episode/:idanime` → get episode list & `epId`
- `/api/server/ep=XXXX` → get sub/dub server list with `srcId`
- `/api/src-server/:srcId` → get HLS `.m3u8` URL

---

## Files to replace in your project

Copy all files from this output folder to your `src/` folder:

```
src/
├── App.jsx                          ← replace
├── context/
│   └── AnimeContextProvider.jsx     ← RENAME from AnimeConextProvider.jsx
├── components/
│   ├── Navbar.jsx                   ← replace
│   ├── AnimeCard.jsx                ← replace
│   └── AnimeForm.jsx                ← replace
└── pages/
    ├── Home.jsx                     ← replace
    ├── Top.jsx                      ← replace
    ├── Dashboard.jsx                ← replace
    ├── Favorites.jsx                ← replace
    ├── Layout.jsx                   ← replace
    ├── AnimeDetails.jsx             ← replace
    ├── WatchPage.jsx                ← replace
    └── NotFound.jsx                 ← replace
```

## Critical: Delete old context file

Delete `src/context/AnimeConextProvider.jsx` (the typo version).

## Make sure your backend is running

```bash
# In your backend folder:
node index.js
# → "Server is running on port 3005"
```

Your backend also needs these routes working:

- `GET /api/v1/anime` — fetch all anime
- `POST /api/v1/anime` — add anime
- `PUT /api/v1/anime/:id` — update anime
- `DELETE /api/v1/anime/:id` — delete anime
- `GET /api/v1/anime/:id` — get single anime

**Live Demo:** [https://anitrackv1.netlify.app/](https://anitrackv1.netlify.app/)

If these don't exist yet, you need to create a MongoDB/Express CRUD backend.

## No other changes needed

- Do NOT change `vite.config.js`
- Do NOT change `main.jsx`
- GSAP and react-router-dom are used as-is
