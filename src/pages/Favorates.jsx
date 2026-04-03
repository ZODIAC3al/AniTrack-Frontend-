import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAnime } from "../context/AnimeConextProvider.jsx";

const STATUS_COLORS = {
  Completed: "#4ade80",
  Watching: "#e63946",
  "Plan to Watch": "#facc15",
  "On Hold": "#818cf8",
  Dropped: "#94a3b8",
};

export default function Favorites() {
  const {
    animes = [],
    favorites = [],
    toggleFavorite,
    isFavorite,
  } = useAnime();
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);
  const [hovered, setHovered] = useState(null);
  const [sortBy, setSortBy] = useState("default");
  const [filterStatus, setFilterStatus] = useState("All");

  useEffect(() => {
    setTimeout(() => setMounted(true), 50);
  }, []);

  // Resolve full anime objects from favorites
  const favAnimes = favorites
    .map((fav) => {
      if (typeof fav === "object" && fav !== null && (fav.title || fav.name)) {
        // Enrich with latest data from library if possible
        const id = String(
          fav._id || fav.id || fav.idani || fav.animeId || fav.idanime || "",
        );
        const libraryVersion = animes.find((a) => String(a._id || a.id) === id);
        return libraryVersion || fav;
      }
      const targetId = String(fav);
      return animes.find(
        (a) =>
          String(a.id || a._id || a.iD || a.idani || a.animeId || a.idanime) ===
          targetId,
      );
    })
    .filter(Boolean);

  // Filter + sort
  const filtered = favAnimes
    .filter((a) => filterStatus === "All" || a.status === filterStatus)
    .sort((a, b) => {
      if (sortBy === "rating") return (b.rating ?? 0) - (a.rating ?? 0);
      if (sortBy === "title")
        return (a.title || "").localeCompare(b.title || "");
      if (sortBy === "year") return (b.releaseYear ?? 0) - (a.releaseYear ?? 0);
      return 0;
    });

  const statuses = ["All", ...Object.keys(STATUS_COLORS)];

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#080608",
        color: "#f0efeb",
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&family=Bebas+Neue&family=Noto+Serif+JP:wght@700;900&display=swap');

        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(230,57,70,0.4); border-radius: 2px; }

        .fav-card {
          position: relative;
          border-radius: 16px;
          overflow: hidden;
          cursor: pointer;
          border: 1px solid rgba(255,255,255,0.06);
          background: rgba(255,255,255,0.02);
          transition: transform 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
        }
        .fav-card:hover {
          transform: translateY(-8px) scale(1.02);
          border-color: rgba(230,57,70,0.4);
          box-shadow: 0 24px 48px rgba(0,0,0,0.6), 0 0 0 1px rgba(230,57,70,0.12);
        }

        .fav-overlay {
          position: absolute; inset: 0;
          background: linear-gradient(to top, rgba(8,6,8,1) 0%, rgba(8,6,8,0.6) 40%, transparent 70%);
          opacity: 0;
          transition: opacity 0.3s ease;
          display: flex; flex-direction: column;
          justify-content: flex-end; padding: 16px;
          z-index: 2;
        }
        .fav-card:hover .fav-overlay { opacity: 1; }

        .remove-btn {
          position: absolute; top: 10px; right: 10px; z-index: 5;
          width: 30px; height: 30px;
          border-radius: 50%;
          background: rgba(0,0,0,0.7);
          border: 1px solid rgba(230,57,70,0.3);
          color: #e63946;
          font-size: 16px;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          opacity: 0;
          transition: opacity 0.2s, transform 0.2s, background 0.2s;
          transform: scale(0.8);
        }
        .fav-card:hover .remove-btn {
          opacity: 1;
          transform: scale(1);
        }
        .remove-btn:hover {
          background: rgba(230,57,70,0.8) !important;
          color: #fff;
        }

        .filter-btn {
          padding: 7px 16px;
          border-radius: 20px;
          font-size: 12px; font-weight: 600;
          cursor: pointer;
          border: 1px solid transparent;
          transition: all 0.2s;
          font-family: 'DM Sans', sans-serif;
          white-space: nowrap;
        }

        .sort-select {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.1);
          color: rgba(240,239,235,0.7);
          padding: 8px 14px;
          border-radius: 10px;
          font-size: 12px;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer;
          outline: none;
          appearance: none;
          padding-right: 28px;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 10 10'%3E%3Cpath fill='%23ffffff55' d='M5 7L0 2h10z'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 10px center;
        }

        .fade-in-card {
          opacity: 0;
          transform: translateY(20px);
          animation: fadeInUp 0.4s ease forwards;
        }
        @keyframes fadeInUp {
          to { opacity: 1; transform: translateY(0); }
        }

        .watch-btn {
          background: #e63946;
          color: #fff; border: none;
          padding: 8px 16px; border-radius: 20px;
          font-size: 12px; font-weight: 700;
          cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          transition: transform 0.2s;
        }
        .watch-btn:hover { transform: scale(1.05); }

        .empty-state {
          display: flex; flex-direction: column; align-items: center;
          justify-content: center; min-height: 60vh;
          text-align: center; gap: 16px;
        }

        @keyframes heartbeat {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.15); }
        }
      `}</style>

      <div style={{ padding: "48px 48px 80px" }}>
        {/* ── HEADER ── */}
        <div
          style={{
            marginBottom: 40,
            opacity: mounted ? 1 : 0,
            transform: mounted ? "none" : "translateY(-20px)",
            transition: "all 0.5s ease",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              marginBottom: 8,
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 14,
                background:
                  "linear-gradient(135deg, rgba(230,57,70,0.2), rgba(230,57,70,0.05))",
                border: "1px solid rgba(230,57,70,0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 22,
                animation:
                  favAnimes.length > 0 ? "heartbeat 2s ease infinite" : "none",
              }}
            >
              ♥
            </div>
            <div>
              <h1
                style={{
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: 44,
                  margin: 0,
                  letterSpacing: "0.06em",
                  background:
                    "linear-gradient(90deg, #f0efeb 0%, rgba(240,239,235,0.6) 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Favorites
              </h1>
              <p
                style={{
                  margin: 0,
                  fontSize: 13,
                  color: "rgba(240,239,235,0.4)",
                }}
              >
                {favAnimes.length} saved · {filtered.length} shown
              </p>
            </div>
          </div>
        </div>

        {favAnimes.length === 0 ? (
          /* ── EMPTY STATE ── */
          <div className="empty-state">
            <div
              style={{
                width: 120,
                height: 120,
                borderRadius: "50%",
                background:
                  "radial-gradient(circle, rgba(230,57,70,0.1) 0%, transparent 70%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 56,
                marginBottom: 8,
              }}
            >
              💔
            </div>
            <h2
              style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: 32,
                letterSpacing: "0.08em",
                margin: 0,
                color: "rgba(255,255,255,0.5)",
              }}
            >
              No Favorites Yet
            </h2>
            <p
              style={{
                color: "rgba(255,255,255,0.3)",
                fontSize: 14,
                margin: 0,
                maxWidth: 360,
              }}
            >
              Browse your library and click the heart icon on any anime to save
              it here.
            </p>
            <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
              <button
                onClick={() => navigate("/")}
                style={{
                  background: "rgba(230,57,70,0.12)",
                  border: "1px solid rgba(230,57,70,0.35)",
                  color: "#e63946",
                  padding: "12px 28px",
                  borderRadius: 20,
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: "'DM Sans', sans-serif",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(230,57,70,0.2)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(230,57,70,0.12)";
                }}
              >
                Browse Library →
              </button>
              <button
                onClick={() => navigate("/top-animes")}
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "rgba(255,255,255,0.6)",
                  padding: "12px 28px",
                  borderRadius: 20,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "'DM Sans', sans-serif",
                  transition: "all 0.2s",
                }}
              >
                Discover Anime
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* ── FILTER BAR ── */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 32,
                flexWrap: "wrap",
                gap: 12,
                opacity: mounted ? 1 : 0,
                transition: "opacity 0.5s ease 0.1s",
              }}
            >
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {statuses.map((s) => (
                  <button
                    key={s}
                    className="filter-btn"
                    onClick={() => setFilterStatus(s)}
                    style={{
                      background:
                        filterStatus === s
                          ? `${STATUS_COLORS[s] || "#e63946"}20`
                          : "rgba(255,255,255,0.04)",
                      borderColor:
                        filterStatus === s
                          ? `${STATUS_COLORS[s] || "#e63946"}70`
                          : "rgba(255,255,255,0.08)",
                      color:
                        filterStatus === s
                          ? STATUS_COLORS[s] || "#e63946"
                          : "rgba(240,239,235,0.5)",
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>
                  Sort:
                </span>
                <select
                  className="sort-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="default">Default</option>
                  <option value="rating">Top Rated</option>
                  <option value="title">A–Z</option>
                  <option value="year">Newest</option>
                </select>
              </div>
            </div>

            {/* ── SUMMARY STRIP ── */}
            <div
              style={{
                display: "flex",
                gap: 20,
                marginBottom: 32,
                flexWrap: "wrap",
                opacity: mounted ? 1 : 0,
                transition: "opacity 0.5s ease 0.15s",
              }}
            >
              {Object.entries(
                favAnimes.reduce((acc, a) => {
                  acc[a.status || "Unknown"] =
                    (acc[a.status || "Unknown"] ?? 0) + 1;
                  return acc;
                }, {}),
              ).map(([status, count]) => (
                <div
                  key={status}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    background: `${STATUS_COLORS[status] || "#94a3b8"}12`,
                    border: `1px solid ${STATUS_COLORS[status] || "#94a3b8"}30`,
                    borderRadius: 10,
                    padding: "6px 14px",
                  }}
                >
                  <div
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: STATUS_COLORS[status] || "#94a3b8",
                    }}
                  />
                  <span
                    style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}
                  >
                    {status}
                  </span>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: STATUS_COLORS[status] || "#94a3b8",
                    }}
                  >
                    {count}
                  </span>
                </div>
              ))}
            </div>

            {/* ── GRID ── */}
            {filtered.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "60px 0",
                  color: "rgba(255,255,255,0.25)",
                }}
              >
                <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
                <div
                  style={{
                    fontFamily: "'Bebas Neue', sans-serif",
                    fontSize: 24,
                    letterSpacing: "0.06em",
                  }}
                >
                  No {filterStatus} anime in favorites
                </div>
              </div>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                  gap: 20,
                }}
              >
                {filtered.map((anime, i) => {
                  const id = anime._id || anime.id || i;
                  return (
                    <div
                      key={id}
                      className="fav-card fade-in-card"
                      style={{ animationDelay: `${i * 0.05}s` }}
                      onMouseEnter={() => setHovered(id)}
                      onMouseLeave={() => setHovered(null)}
                      onClick={() => navigate(`/animes/${id}`)}
                    >
                      {/* Cover image */}
                      <div style={{ height: 280, position: "relative" }}>
                        {anime.coverImageUrl ? (
                          <img
                            src={anime.coverImageUrl}
                            alt={anime.title}
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                              display: "block",
                            }}
                            onError={(e) => {
                              e.target.style.display = "none";
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: "100%",
                              height: "100%",
                              background: `linear-gradient(135deg, hsl(${i * 37}, 40%, 16%), hsl(${i * 37 + 40}, 30%, 8%))`,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: 56,
                              color: "rgba(255,255,255,0.15)",
                            }}
                          >
                            {anime.title?.charAt(0) || "?"}
                          </div>
                        )}

                        {/* Status badge */}
                        <div
                          style={{
                            position: "absolute",
                            top: 10,
                            left: 10,
                            background: `${STATUS_COLORS[anime.status] || "#94a3b8"}22`,
                            border: `1px solid ${STATUS_COLORS[anime.status] || "#94a3b8"}55`,
                            color: STATUS_COLORS[anime.status] || "#94a3b8",
                            fontSize: 9,
                            fontWeight: 700,
                            padding: "3px 8px",
                            borderRadius: 4,
                            textTransform: "uppercase",
                            letterSpacing: "0.08em",
                          }}
                        >
                          {anime.status?.split(" ")[0] || "Unknown"}
                        </div>

                        {/* Rating */}
                        {anime.rating > 0 && (
                          <div
                            style={{
                              position: "absolute",
                              top: 10,
                              right: 42,
                              background: "rgba(0,0,0,0.75)",
                              border: "1px solid rgba(250,204,21,0.3)",
                              color: "#facc15",
                              fontSize: 11,
                              fontWeight: 700,
                              padding: "3px 8px",
                              borderRadius: 6,
                            }}
                          >
                            ★ {anime.rating}
                          </div>
                        )}

                        {/* Remove button */}
                        <button
                          className="remove-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(anime);
                          }}
                        >
                          ×
                        </button>

                        {/* Hover overlay */}
                        <div className="fav-overlay">
                          <div
                            style={{
                              fontSize: 13,
                              fontWeight: 700,
                              marginBottom: 6,
                              color: "#fff",
                            }}
                          >
                            {anime.title}
                          </div>
                          {anime.studio && (
                            <div
                              style={{
                                fontSize: 11,
                                color: "rgba(255,255,255,0.5)",
                                marginBottom: 10,
                              }}
                            >
                              {anime.studio}{" "}
                              {anime.releaseYear
                                ? `· ${anime.releaseYear}`
                                : ""}
                            </div>
                          )}
                          <div style={{ display: "flex", gap: 8 }}>
                            <button
                              className="watch-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/animes/${id}`);
                              }}
                            >
                              ▶ Details
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/watch/${id}`);
                              }}
                              style={{
                                background: "rgba(255,255,255,0.15)",
                                border: "1px solid rgba(255,255,255,0.2)",
                                color: "#fff",
                                padding: "8px 14px",
                                borderRadius: 20,
                                fontSize: 12,
                                fontWeight: 600,
                                cursor: "pointer",
                                fontFamily: "'DM Sans', sans-serif",
                              }}
                            >
                              Watch
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Card footer */}
                      <div style={{ padding: "12px 14px 14px" }}>
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: 700,
                            marginBottom: 4,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {anime.title}
                        </div>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <span
                            style={{
                              fontSize: 11,
                              color: "rgba(255,255,255,0.35)",
                            }}
                          >
                            {anime.episodesWatched > 0
                              ? `${anime.episodesWatched} eps watched`
                              : anime.studio || "—"}
                          </span>
                          {anime.rating > 0 && (
                            <span style={{ fontSize: 11, color: "#facc15" }}>
                              ★ {anime.rating}
                            </span>
                          )}
                        </div>
                        {/* Episode progress bar */}
                        {anime.totalEpisodes > 0 && (
                          <div style={{ marginTop: 8 }}>
                            <div
                              style={{
                                height: 2,
                                background: "rgba(255,255,255,0.06)",
                                borderRadius: 1,
                              }}
                            >
                              <div
                                style={{
                                  height: "100%",
                                  width: `${Math.min(100, ((anime.episodesWatched || 0) / anime.totalEpisodes) * 100)}%`,
                                  background:
                                    STATUS_COLORS[anime.status] || "#e63946",
                                  borderRadius: 1,
                                  transition: "width 0.5s ease",
                                }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
