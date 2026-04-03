/**
 * WatchPage.jsx — Fixed & Redesigned
 *
 * Episode fetching: Uses /api/episode/:animeId which hits aniwatchtv.to/ajax/v2/episode/list/:id
 * Full 4-step Aniwatch flow:
 *   A: /api/search/:title/1       → get animeId
 *   B: /api/episode/:animeId      → get episode list (parses aniwatchtv.to AJAX)
 *   C: /api/server/:epQueryParam  → get sub/dub servers
 *   D: /api/src-server/:srcId     → get HLS stream URL
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { useLoaderData, useNavigate, useSearchParams } from "react-router-dom";

const ANIWATCH = "https://aniwatch-api-v1-0.onrender.com/api";

// ── Load hls.js ──────────────────────────────────────────────────
function loadHls() {
  return new Promise((resolve) => {
    if (window.Hls) {
      resolve(window.Hls);
      return;
    }
    const s = document.createElement("script");
    s.src = "https://cdn.jsdelivr.net/npm/hls.js@1.4.12/dist/hls.min.js";
    s.onload = () => resolve(window.Hls);
    s.onerror = () => resolve(null);
    document.head.appendChild(s);
  });
}

// ── AniList episode count fallback ──────────────────────────────
async function fetchAniListEpisodes(title) {
  try {
    const res = await fetch("https://graphql.anilist.co", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: `query ($s: String) { Media(search: $s, type: ANIME) { episodes } }`,
        variables: { s: title },
      }),
    });
    const { data } = await res.json();
    return data?.Media?.episodes ?? null;
  } catch {
    return null;
  }
}

const SERVER_LABELS = {
  vidstreaming: "VidStreaming",
  megacloud: "MegaCloud",
  streamsb: "StreamSB",
  streamtape: "StreamTape",
};

// ── Sub-components ───────────────────────────────────────────────
function ServerBtn({ label, active, failed, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        background: active ? "rgba(52,211,153,0.1)" : "rgba(255,255,255,0.04)",
        border: `1px solid ${active ? "rgba(52,211,153,0.4)" : failed ? "rgba(239,68,68,0.3)" : "rgba(255,255,255,0.1)"}`,
        color: active
          ? "#34d399"
          : failed
            ? "rgba(255,255,255,0.25)"
            : "rgba(240,239,235,0.7)",
        fontFamily: "'DM Sans',sans-serif",
        fontSize: 12,
        fontWeight: 600,
        padding: "8px 16px",
        borderRadius: 8,
        cursor: failed ? "not-allowed" : "pointer",
        opacity: failed ? 0.4 : 1,
        textDecoration: failed ? "line-through" : "none",
        transition: "all 0.18s",
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          flexShrink: 0,
          background: failed
            ? "#e63946"
            : active
              ? "#34d399"
              : "rgba(255,255,255,0.2)",
          boxShadow: active ? "0 0 8px #34d399" : "none",
        }}
      />
      {label}
    </button>
  );
}

function EpGrid({ episodes, current, watched, onSelect }) {
  const containerRef = useRef(null);

  // Auto-scroll to current episode
  useEffect(() => {
    if (!containerRef.current) return;
    const btn = containerRef.current.querySelector(`[data-ep="${current}"]`);
    if (btn) btn.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [current]);

  return (
    <div
      ref={containerRef}
      style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 5 }}
    >
      {episodes.map((ep) => {
        const isActive = ep === current;
        const isWatched = watched.has(ep);
        return (
          <button
            key={ep}
            data-ep={ep}
            onClick={() => onSelect(ep)}
            style={{
              background: isActive
                ? "rgba(230,57,70,0.2)"
                : isWatched
                  ? "rgba(52,211,153,0.07)"
                  : "rgba(255,255,255,0.04)",
              border: `1px solid ${isActive ? "rgba(230,57,70,0.55)" : isWatched ? "rgba(52,211,153,0.2)" : "rgba(255,255,255,0.07)"}`,
              color: isActive
                ? "#e63946"
                : isWatched
                  ? "rgba(52,211,153,0.7)"
                  : "rgba(240,239,235,0.5)",
              fontFamily: "'DM Sans',sans-serif",
              fontSize: 11,
              fontWeight: 600,
              padding: "7px 2px",
              borderRadius: 6,
              cursor: "pointer",
              textAlign: "center",
              transition: "all 0.15s",
              boxShadow: isActive ? "0 0 12px rgba(230,57,70,0.2)" : "none",
            }}
          >
            {ep}
          </button>
        );
      })}
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────
export default function WatchPage() {
  const anime = useLoaderData();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const videoRef = useRef(null);
  const hlsRef = useRef(null);

  // Episode state
  const [currentEp, setCurrentEp] = useState(
    parseInt(searchParams.get("ep")) || 1,
  );
  const [totalEpisodes, setTotalEpisodes] = useState(anime?.totalEpisodes ?? 0);
  const [watchedEps, setWatchedEps] = useState(new Set());
  const [anilistLoading, setAnilistLoading] = useState(true);

  // Server state
  const [servers, setServers] = useState([]);
  const [currentServer, setCurrentServer] = useState(null);
  const [serversLoading, setServersLoading] = useState(false);
  const [serverError, setServerError] = useState(null);

  // Stream state
  const [streamUrl, setStreamUrl] = useState(null);
  const [streamLoading, setStreamLoading] = useState(false);
  const [streamError, setStreamError] = useState(null);
  const [failedServers, setFailedServers] = useState(new Set());

  // UI
  const [audioMode, setAudioMode] = useState("sub");
  const [sidebarTab, setSidebarTab] = useState("episodes"); // "episodes" | "info"
  const [isFullscreen, setIsFullscreen] = useState(false);

  const title = anime?.title ?? "";
  const coverImageUrl =
    anime?.coverImageUrl ?? anime?.coverImage ?? anime?.image;

  // ── 1. Fetch AniList episode count ──────────────────────────────
  useEffect(() => {
    if (!title) {
      setAnilistLoading(false);
      return;
    }
    setAnilistLoading(true);
    fetchAniListEpisodes(title)
      .then((count) => {
        if (count) setTotalEpisodes(count);
      })
      .finally(() => setAnilistLoading(false));
  }, [title]);

  // ── 2. Fetch servers via Aniwatch 4-step flow ───────────────────
  useEffect(() => {
    if (!title) return;
    let alive = true;

    const run = async () => {
      setServers([]);
      setCurrentServer(null);
      setStreamUrl(null);
      setStreamError(null);
      setServerError(null);
      setFailedServers(new Set());
      setServersLoading(true);

      try {
        // Step A: Search
        const searchRes = await fetch(
          `${ANIWATCH}/search/${encodeURIComponent(title)}/1`,
        );
        if (!searchRes.ok) throw new Error("Aniwatch search failed");
        const searchData = await searchRes.json();

        const results = searchData.searchYour ?? [];
        if (!results.length)
          throw new Error(`"${title}" not found on Aniwatch`);

        // Try to find a closer match by title similarity
        const normalize = (s) =>
          s?.toLowerCase().replace(/[^a-z0-9]/g, "") ?? "";
        const normalTitle = normalize(title);
        const best =
          results.find((r) =>
            normalize(r.name).includes(normalTitle.slice(0, 6)),
          ) ?? results[0];
        const animeId = best.idanime;

        // Step B: Episode list — hits /ajax/v2/episode/list/:id on the backend
        const epRes = await fetch(`${ANIWATCH}/episode/${animeId}`);
        if (!epRes.ok) throw new Error("Failed to fetch episode list");
        const epData = await epRes.json();

        const episodes = epData.episodetown ?? [];
        if (!episodes.length) throw new Error("No episodes available");

        // Find the target episode by order number
        const targetEp =
          episodes.find((e) => parseInt(e.order) === currentEp) ??
          episodes[Math.min(currentEp - 1, episodes.length - 1)];

        if (!targetEp) throw new Error(`Episode ${currentEp} not found`);

        // epId format: "anime-slug?ep=XXXX" → extract query string
        const epQuery = targetEp.epId.includes("?")
          ? targetEp.epId.split("?")[1]
          : `ep=${targetEp.epId}`;

        // Step C: Servers
        const srvRes = await fetch(`${ANIWATCH}/server/${epQuery}`);
        if (!srvRes.ok) throw new Error("Failed to fetch servers");
        const srvData = await srvRes.json();

        if (!alive) return;

        const subSrv = srvData.sub ?? [];
        const dubSrv = srvData.dub ?? [];
        const activeSrv =
          audioMode === "dub" && dubSrv.length > 0 ? dubSrv : subSrv;

        if (!activeSrv.length) throw new Error("No servers for this episode");

        setServers(activeSrv);
        setCurrentServer(activeSrv[0]);
      } catch (err) {
        console.error("Server fetch:", err);
        if (alive) setServerError(err.message);
      } finally {
        if (alive) setServersLoading(false);
      }
    };

    run();
    setSearchParams({ ep: currentEp }, { replace: true });
    return () => {
      alive = false;
    };
  }, [currentEp, title, audioMode]); // eslint-disable-line

  // ── 3. Fetch stream URL ─────────────────────────────────────────
  useEffect(() => {
    if (!currentServer?.srcId) return;
    let alive = true;

    const run = async () => {
      setStreamUrl(null);
      setStreamError(null);
      setStreamLoading(true);
      try {
        const res = await fetch(
          `${ANIWATCH}/src-server/${currentServer.srcId}`,
        );
        if (!res.ok) throw new Error(`Server error ${res.status}`);
        const data = await res.json();

        let url = null;
        if (data.restres?.sources?.length > 0) {
          url =
            data.restres.sources.find((s) => s.type === "hls")?.url ??
            data.restres.sources[0]?.url;
        } else if (data.serverSrc?.[0]?.rest?.length > 0) {
          url =
            data.serverSrc[0].rest.find((r) => r.type === "hls")?.file ??
            data.serverSrc[0].rest[0]?.file;
        }

        if (!url) throw new Error("No playable stream found");
        if (!alive) return;
        setStreamUrl(url);
        setWatchedEps((prev) => new Set([...prev, currentEp]));
      } catch (err) {
        console.error("Stream fetch:", err);
        if (alive) {
          setStreamError("This server failed. Try another.");
          setFailedServers((prev) => new Set([...prev, currentServer.server]));
        }
      } finally {
        if (alive) setStreamLoading(false);
      }
    };

    run();
    return () => {
      alive = false;
    };
  }, [currentServer]);

  // ── 4. Play HLS ─────────────────────────────────────────────────
  useEffect(() => {
    if (!streamUrl || !videoRef.current) return;
    const video = videoRef.current;

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    if (streamUrl.includes(".m3u8")) {
      loadHls().then((Hls) => {
        if (!Hls) {
          if (video.canPlayType("application/vnd.apple.mpegurl")) {
            video.src = streamUrl;
            video.play().catch(() => {});
          } else {
            setStreamError("HLS not supported in this browser");
          }
          return;
        }
        if (Hls.isSupported()) {
          const hls = new Hls({ enableWorker: true });
          hls.loadSource(streamUrl);
          hls.attachMedia(video);
          hls.on(Hls.Events.MANIFEST_PARSED, () =>
            video.play().catch(() => {}),
          );
          hls.on(Hls.Events.ERROR, (_, d) => {
            if (d.fatal) setStreamError("Stream error. Try another server.");
          });
          hlsRef.current = hls;
        }
      });
    } else {
      video.src = streamUrl;
      video.play().catch(() => {});
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [streamUrl]);

  const handleEpSelect = useCallback((ep) => {
    setCurrentEp(ep);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const episodes = Array.from({ length: totalEpisodes }, (_, i) => i + 1);

  if (!anime) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#080608",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "'DM Sans',sans-serif",
          color: "rgba(255,255,255,0.4)",
          fontSize: 14,
        }}
      >
        Anime not found.
      </div>
    );
  }

  const isLoading = serversLoading || (streamLoading && !streamUrl);
  const showVideo = streamUrl && !streamError && !streamLoading;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#080608",
        color: "#f0efeb",
        fontFamily: "'DM Sans',sans-serif",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&family=Bebas+Neue&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        
        video { background: #050101; display: block; width: 100%; }
        
        .wp-server-btn:hover:not([disabled]) {
          background: rgba(52,211,153,0.07) !important;
          border-color: rgba(52,211,153,0.3) !important;
          color: #34d399 !important;
        }
        .wp-ep-btn:hover {
          background: rgba(230,57,70,0.12) !important;
          border-color: rgba(230,57,70,0.4) !important;
          color: #e63946 !important;
        }
        .wp-nav-btn:hover {
          background: rgba(230,57,70,0.1) !important;
          border-color: rgba(230,57,70,0.35) !important;
          color: #e63946 !important;
        }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-thumb { background: rgba(230,57,70,0.3); border-radius: 2px; }

        @media (max-width: 900px) {
          .wp-layout { flex-direction: column !important; }
          .wp-sidebar { width: 100% !important; max-height: 350px !important; position: static !important; min-height: unset !important; }
        }
      `}</style>

      {/* ── HEADER ── */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          background: "rgba(8,6,8,0.9)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          padding: "0 24px",
          height: 58,
          display: "flex",
          alignItems: "center",
          gap: 16,
        }}
      >
        {/* Brand */}
        <div
          onClick={() => navigate("/")}
          style={{
            fontFamily: "'Bebas Neue',sans-serif",
            fontSize: 20,
            letterSpacing: "0.1em",
            background: "linear-gradient(90deg, #e63946, #ff8fa3)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            cursor: "pointer",
            flexShrink: 0,
          }}
        >
          ANITRACK
        </div>

        {/* Back */}
        <button
          onClick={() => navigate(`/animes/${anime._id ?? anime.id}`)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "rgba(240,239,235,0.7)",
            fontFamily: "'DM Sans',sans-serif",
            fontSize: 12,
            fontWeight: 500,
            padding: "6px 12px",
            borderRadius: 8,
            cursor: "pointer",
            transition: "all 0.18s",
            flexShrink: 0,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "rgba(230,57,70,0.4)";
            e.currentTarget.style.color = "#e63946";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
            e.currentTarget.style.color = "rgba(240,239,235,0.7)";
          }}
        >
          ← Back
        </button>

        {/* Anime info */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            flex: 1,
            overflow: "hidden",
            minWidth: 0,
          }}
        >
          {coverImageUrl && (
            <img
              src={coverImageUrl}
              alt=""
              style={{
                width: 28,
                height: 38,
                objectFit: "cover",
                borderRadius: 4,
                flexShrink: 0,
              }}
              onError={(e) => {
                e.target.style.display = "none";
              }}
            />
          )}
          <div style={{ overflow: "hidden" }}>
            <div
              style={{
                fontFamily: "'Bebas Neue',sans-serif",
                fontSize: 15,
                letterSpacing: "0.06em",
                color: "#f0efeb",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {title}
            </div>
            <div
              style={{
                fontSize: 10,
                color: "rgba(240,239,235,0.35)",
                letterSpacing: "0.06em",
              }}
            >
              Episode {currentEp}
              {totalEpisodes > 0 ? ` of ${totalEpisodes}` : ""}
            </div>
          </div>
        </div>

        {/* Sub/Dub toggle */}
        <div
          style={{
            display: "flex",
            gap: 3,
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 8,
            padding: 3,
            flexShrink: 0,
          }}
        >
          {["sub", "dub"].map((m) => (
            <button
              key={m}
              onClick={() => setAudioMode(m)}
              style={{
                padding: "5px 14px",
                borderRadius: 6,
                border: "none",
                background:
                  audioMode === m ? "rgba(230,57,70,0.2)" : "transparent",
                color: audioMode === m ? "#e63946" : "rgba(240,239,235,0.4)",
                fontFamily: "'DM Sans',sans-serif",
                fontSize: 10,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                cursor: "pointer",
                transition: "all 0.18s",
              }}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* ── BODY ── */}
      <div
        className="wp-layout"
        style={{
          display: "flex",
          flex: 1,
          maxWidth: 1600,
          width: "100%",
          margin: "0 auto",
        }}
      >
        {/* ── PLAYER COLUMN ── */}
        <div
          style={{
            flex: 1,
            minWidth: 0,
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Video */}
          <div
            style={{
              position: "relative",
              width: "100%",
              aspectRatio: "16/9",
              background: "#050101",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {/* Loading overlay */}
            {isLoading && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  zIndex: 5,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "rgba(5,1,1,0.92)",
                  animation: "fadeIn 0.3s ease",
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    marginBottom: 16,
                    border: "3px solid rgba(255,255,255,0.06)",
                    borderTop: "3px solid #e63946",
                    borderRadius: "50%",
                    animation: "spin 0.8s linear infinite",
                  }}
                />
                <div
                  style={{
                    fontSize: 13,
                    color: "rgba(240,239,235,0.4)",
                    fontWeight: 500,
                  }}
                >
                  {serversLoading ? "Finding servers…" : "Loading stream…"}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: "rgba(240,239,235,0.2)",
                    marginTop: 6,
                  }}
                >
                  This may take a moment on first load
                </div>
              </div>
            )}

            {/* Stream error */}
            {streamError && !streamLoading && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  zIndex: 5,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "rgba(5,1,1,0.92)",
                  padding: 24,
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: 36, marginBottom: 12 }}>⚠</div>
                <div
                  style={{
                    fontSize: 15,
                    color: "#e63946",
                    fontWeight: 700,
                    marginBottom: 6,
                  }}
                >
                  {streamError}
                </div>
                <div style={{ fontSize: 12, color: "rgba(240,239,235,0.3)" }}>
                  Select a different server below
                </div>
              </div>
            )}

            {/* Server error */}
            {serverError && !serversLoading && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  zIndex: 5,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "rgba(5,1,1,0.92)",
                  padding: 24,
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: 36, marginBottom: 12 }}>📡</div>
                <div
                  style={{
                    fontSize: 15,
                    color: "#e63946",
                    fontWeight: 700,
                    marginBottom: 6,
                  }}
                >
                  {serverError}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: "rgba(240,239,235,0.3)",
                    marginBottom: 16,
                  }}
                >
                  Make sure your Aniwatch API server is running
                </div>
                <button
                  onClick={() => setCurrentEp(currentEp)}
                  style={{
                    background: "rgba(230,57,70,0.15)",
                    border: "1px solid rgba(230,57,70,0.4)",
                    color: "#e63946",
                    padding: "8px 20px",
                    borderRadius: 20,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                    fontFamily: "'DM Sans',sans-serif",
                  }}
                >
                  Try Again
                </button>
              </div>
            )}

            {/* Idle - no error, not loading */}
            {!isLoading && !streamUrl && !streamError && !serverError && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  zIndex: 5,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "rgba(5,1,1,0.92)",
                }}
              >
                <div style={{ fontSize: 48, marginBottom: 12, opacity: 0.4 }}>
                  ▶
                </div>
                <div style={{ fontSize: 13, color: "rgba(240,239,235,0.3)" }}>
                  Select a server to start watching
                </div>
              </div>
            )}

            <video
              ref={videoRef}
              controls
              playsInline
              style={{
                width: "100%",
                height: "100%",
                opacity: showVideo ? 1 : 0,
                transition: "opacity 0.4s ease",
              }}
            />
          </div>

          {/* ── SERVERS ── */}
          <div
            style={{
              padding: "16px 20px",
              borderBottom: "1px solid rgba(255,255,255,0.05)",
              background: "rgba(255,255,255,0.01)",
            }}
          >
            <div
              style={{
                fontSize: 9,
                fontWeight: 800,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                color: "#e63946",
                marginBottom: 10,
              }}
            >
              Servers
            </div>
            {serversLoading ? (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div
                  style={{
                    width: 14,
                    height: 14,
                    border: "2px solid rgba(255,255,255,0.06)",
                    borderTop: "2px solid #e63946",
                    borderRadius: "50%",
                    animation: "spin 0.8s linear infinite",
                  }}
                />
                <span style={{ fontSize: 12, color: "rgba(240,239,235,0.35)" }}>
                  Finding servers…
                </span>
              </div>
            ) : servers.length === 0 && !serverError ? (
              <span style={{ fontSize: 12, color: "rgba(240,239,235,0.25)" }}>
                No servers found
              </span>
            ) : (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {servers.map((srv, i) => (
                  <ServerBtn
                    key={i}
                    label={
                      SERVER_LABELS[srv.server] ??
                      srv.server ??
                      `Server ${i + 1}`
                    }
                    active={currentServer === srv}
                    failed={failedServers.has(srv.server)}
                    onClick={() =>
                      !failedServers.has(srv.server) && setCurrentServer(srv)
                    }
                  />
                ))}
              </div>
            )}
          </div>

          {/* ── EP NAV ── */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "12px 20px",
              borderBottom: "1px solid rgba(255,255,255,0.05)",
            }}
          >
            <button
              onClick={() => currentEp > 1 && handleEpSelect(currentEp - 1)}
              disabled={currentEp <= 1}
              className="wp-nav-btn"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.09)",
                color: "#f0efeb",
                fontFamily: "'DM Sans',sans-serif",
                fontSize: 12,
                fontWeight: 600,
                padding: "8px 18px",
                borderRadius: 8,
                cursor: currentEp <= 1 ? "not-allowed" : "pointer",
                opacity: currentEp <= 1 ? 0.3 : 1,
                transition: "all 0.18s",
              }}
            >
              ← Prev
            </button>

            <div
              style={{
                fontSize: 12,
                color: "rgba(240,239,235,0.35)",
                letterSpacing: "0.04em",
              }}
            >
              <span style={{ color: "#e63946", fontWeight: 700 }}>
                Ep {currentEp}
              </span>
              {totalEpisodes > 0 && <span> / {totalEpisodes}</span>}
            </div>

            <button
              onClick={() =>
                currentEp < totalEpisodes && handleEpSelect(currentEp + 1)
              }
              disabled={totalEpisodes > 0 && currentEp >= totalEpisodes}
              className="wp-nav-btn"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.09)",
                color: "#f0efeb",
                fontFamily: "'DM Sans',sans-serif",
                fontSize: 12,
                fontWeight: 600,
                padding: "8px 18px",
                borderRadius: 8,
                cursor:
                  totalEpisodes > 0 && currentEp >= totalEpisodes
                    ? "not-allowed"
                    : "pointer",
                opacity:
                  totalEpisodes > 0 && currentEp >= totalEpisodes ? 0.3 : 1,
                transition: "all 0.18s",
              }}
            >
              Next →
            </button>
          </div>

          {/* ── ANIME INFO ── */}
          <div
            style={{
              padding: "20px",
              display: "flex",
              gap: 16,
              alignItems: "flex-start",
            }}
          >
            {coverImageUrl && (
              <img
                src={coverImageUrl}
                alt={title}
                style={{
                  width: 72,
                  height: 100,
                  objectFit: "cover",
                  borderRadius: 8,
                  flexShrink: 0,
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
                onError={(e) => {
                  e.target.style.display = "none";
                }}
              />
            )}
            <div>
              <h2
                style={{
                  fontFamily: "'Bebas Neue',sans-serif",
                  fontSize: 22,
                  letterSpacing: "0.06em",
                  margin: "0 0 4px",
                }}
              >
                {title}
              </h2>
              {anime.studio && (
                <div
                  style={{
                    fontSize: 12,
                    color: "rgba(255,255,255,0.4)",
                    marginBottom: 8,
                  }}
                >
                  {anime.studio}
                </div>
              )}
              {anime.notes && (
                <p
                  style={{
                    fontSize: 12,
                    color: "rgba(255,255,255,0.4)",
                    margin: 0,
                    lineHeight: 1.6,
                    maxWidth: 600,
                  }}
                >
                  {anime.notes}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ── SIDEBAR ── */}
        <div
          className="wp-sidebar"
          style={{
            width: 290,
            flexShrink: 0,
            borderLeft: "1px solid rgba(255,255,255,0.06)",
            minHeight: "calc(100vh - 58px)",
            display: "flex",
            flexDirection: "column",
            overflowY: "auto",
            maxHeight: "calc(100vh - 58px)",
            position: "sticky",
            top: 58,
          }}
        >
          {/* Sidebar tabs */}
          <div
            style={{
              display: "flex",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
              flexShrink: 0,
            }}
          >
            {["episodes", "info"].map((tab) => (
              <button
                key={tab}
                onClick={() => setSidebarTab(tab)}
                style={{
                  flex: 1,
                  padding: "14px 0",
                  background: "transparent",
                  border: "none",
                  color:
                    sidebarTab === tab ? "#e63946" : "rgba(240,239,235,0.35)",
                  fontFamily: "'DM Sans',sans-serif",
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                  borderBottom:
                    sidebarTab === tab
                      ? "2px solid #e63946"
                      : "2px solid transparent",
                  transition: "all 0.18s",
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          <div style={{ flex: 1, padding: "16px 14px", overflowY: "auto" }}>
            {sidebarTab === "episodes" ? (
              <>
                {/* Legend */}
                <div
                  style={{
                    display: "flex",
                    gap: 14,
                    marginBottom: 12,
                    fontSize: 10,
                    color: "rgba(240,239,235,0.3)",
                  }}
                >
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 5 }}
                  >
                    <span
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: "50%",
                        background: "#34d399",
                        display: "inline-block",
                      }}
                    />
                    Watched
                  </div>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 5 }}
                  >
                    <span
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: "50%",
                        background: "#e63946",
                        display: "inline-block",
                      }}
                    />
                    Current
                  </div>
                </div>

                {anilistLoading ? (
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <div
                      style={{
                        width: 14,
                        height: 14,
                        border: "2px solid rgba(255,255,255,0.06)",
                        borderTop: "2px solid #e63946",
                        borderRadius: "50%",
                        animation: "spin 0.8s linear infinite",
                      }}
                    />
                    <span
                      style={{ fontSize: 12, color: "rgba(240,239,235,0.3)" }}
                    >
                      Loading…
                    </span>
                  </div>
                ) : episodes.length === 0 ? (
                  <div
                    style={{
                      fontSize: 12,
                      color: "rgba(240,239,235,0.25)",
                      textAlign: "center",
                      paddingTop: 20,
                    }}
                  >
                    Episode list unavailable
                  </div>
                ) : (
                  <EpGrid
                    episodes={episodes}
                    current={currentEp}
                    watched={watchedEps}
                    onSelect={handleEpSelect}
                  />
                )}
              </>
            ) : (
              /* Info tab */
              <div
                style={{ display: "flex", flexDirection: "column", gap: 14 }}
              >
                {[
                  ["Status", anime.status],
                  ["Studio", anime.studio],
                  ["Year", anime.releaseYear],
                  ["Episodes Watched", anime.episodesWatched],
                  [
                    "Total Episodes",
                    anime.totalEpisodes || totalEpisodes || "—",
                  ],
                  ["Rating", anime.rating ? `${anime.rating}/10` : null],
                  ["Setting", anime.historicalSetting],
                ]
                  .filter(([, v]) => v)
                  .map(([label, value]) => (
                    <div
                      key={label}
                      style={{
                        borderBottom: "1px solid rgba(255,255,255,0.04)",
                        paddingBottom: 10,
                      }}
                    >
                      <div
                        style={{
                          fontSize: 9,
                          fontWeight: 700,
                          letterSpacing: "0.12em",
                          color: "rgba(240,239,235,0.3)",
                          textTransform: "uppercase",
                          marginBottom: 4,
                        }}
                      >
                        {label}
                      </div>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: "#f0efeb",
                        }}
                      >
                        {value}
                      </div>
                    </div>
                  ))}

                {/* Progress bar if episodes known */}
                {(anime.totalEpisodes || totalEpisodes) > 0 && (
                  <div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: 6,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 9,
                          fontWeight: 700,
                          letterSpacing: "0.12em",
                          color: "rgba(240,239,235,0.3)",
                          textTransform: "uppercase",
                        }}
                      >
                        Progress
                      </span>
                      <span
                        style={{
                          fontSize: 11,
                          color: "#facc15",
                          fontWeight: 700,
                        }}
                      >
                        {Math.round(
                          ((anime.episodesWatched || 0) /
                            (anime.totalEpisodes || totalEpisodes)) *
                            100,
                        )}
                        %
                      </span>
                    </div>
                    <div
                      style={{
                        height: 4,
                        background: "rgba(255,255,255,0.07)",
                        borderRadius: 2,
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          width: `${Math.min(100, ((anime.episodesWatched || 0) / (anime.totalEpisodes || totalEpisodes)) * 100)}%`,
                          background:
                            "linear-gradient(90deg, #e63946, #facc15)",
                          borderRadius: 2,
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
