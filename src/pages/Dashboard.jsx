import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAnime } from "../context/AnimeConextProvider.jsx";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

// ── Helpers ────────────────────────────────────────────────────────────────
const generateAreaData = (animes) => {
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  return months.map((m, i) => ({
    month: m,
    completed: Math.max(
      0,
      animes.filter((a) => a.status === "Completed").length -
        (11 - i) * 2 +
        Math.floor(Math.random() * 4),
    ),
    watching: Math.max(
      0,
      animes.filter((a) => a.status === "Watching").length -
        (11 - i) +
        Math.floor(Math.random() * 3),
    ),
  }));
};

const STATUS_COLORS = {
  Completed: "#4ade80",
  Watching: "#e63946",
  "Plan to Watch": "#facc15",
  "On Hold": "#818cf8",
  Dropped: "#94a3b8",
};

const StarRating = ({ value }) => {
  const filled = Math.round(value / 2);
  return (
    <span style={{ color: "#facc15", fontSize: 11, letterSpacing: 1 }}>
      {"★".repeat(Math.max(0, filled))}
      {"☆".repeat(Math.max(0, 5 - filled))}
    </span>
  );
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: "rgba(15,10,10,0.95)",
        border: "1px solid rgba(230,57,70,0.3)",
        borderRadius: 10,
        padding: "10px 16px",
        fontSize: 12,
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      <div style={{ color: "rgba(255,255,255,0.5)", marginBottom: 6 }}>
        {label}
      </div>
      {payload.map((p) => (
        <div key={p.dataKey} style={{ color: p.color, fontWeight: 600 }}>
          {p.dataKey === "completed" ? "Completed" : "Watching"}: {p.value}
        </div>
      ))}
    </div>
  );
};

export default function Dashboard() {
  const { animes, favorites, isFavorite, toggleFavorite } = useAnime();
  const navigate = useNavigate();
  const [activeStatus, setActiveStatus] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setTimeout(() => setMounted(true), 50);
  }, []);

  // Stats
  const completed = animes.filter((a) => a.status === "Completed").length;
  const watching = animes.filter((a) => a.status === "Watching").length;
  const planToWatch = animes.filter((a) => a.status === "Plan to Watch").length;
  const totalEps = animes.reduce((s, a) => s + (a.episodesWatched ?? 0), 0);
  const avgRating = animes.length
    ? (animes.reduce((s, a) => s + (a.rating ?? 0), 0) / animes.length).toFixed(
        1,
      )
    : "—";

  // Chart data
  const areaData = useMemo(() => generateAreaData(animes), [animes.length]);

  const statusData = useMemo(() => {
    const map = {};
    animes.forEach((a) => {
      map[a.status] = (map[a.status] ?? 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [animes]);

  // Studios
  const topStudios = useMemo(() => {
    const map = {};
    animes.forEach((a) => {
      if (a.studio) map[a.studio] = (map[a.studio] ?? 0) + 1;
    });
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [animes]);

  // Recent & featured
  const recent = [...animes].reverse().slice(0, 6);
  const featured = animes.find((a) => a.rating >= 9) || recent[0];

  // Filtered
  const displayed = animes
    .filter((a) => {
      const matchStatus = activeStatus === "All" || a.status === activeStatus;
      const matchSearch =
        !searchQuery ||
        a.title?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchStatus && matchSearch;
    })
    .slice(0, 8);

  const statuses = [
    "All",
    "Watching",
    "Completed",
    "Plan to Watch",
    "On Hold",
    "Dropped",
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#080608",
        color: "#f0efeb",
        fontFamily: "'DM Sans', sans-serif",
        overflowX: "hidden",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&family=Bebas+Neue&family=Noto+Serif+JP:wght@700;900&display=swap');

        * { box-sizing: border-box; }
        
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(230,57,70,0.4); border-radius: 2px; }

        .dash-fadeup {
          opacity: 0;
          transform: translateY(24px);
          transition: opacity 0.6s ease, transform 0.6s ease;
        }
        .dash-fadeup.visible {
          opacity: 1;
          transform: translateY(0);
        }

        .stat-card {
          background: linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 16px;
          padding: 20px;
          transition: border-color 0.2s, transform 0.2s;
          cursor: default;
        }
        .stat-card:hover {
          border-color: rgba(230,57,70,0.35);
          transform: translateY(-2px);
        }

        .anime-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 14px;
          overflow: hidden;
          cursor: pointer;
          transition: transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease;
        }
        .anime-card:hover {
          transform: translateY(-6px) scale(1.01);
          border-color: rgba(230,57,70,0.45);
          box-shadow: 0 20px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(230,57,70,0.15);
        }

        .fav-btn {
          width: 28px; height: 28px;
          border-radius: 50%;
          border: none;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          font-size: 14px;
          transition: transform 0.2s, background 0.2s;
        }
        .fav-btn:hover { transform: scale(1.2); }

        .status-pill {
          padding: 6px 14px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          border: 1px solid transparent;
          transition: all 0.2s ease;
          white-space: nowrap;
        }

        .hero-play-btn {
          display: inline-flex; align-items: center; gap: 8px;
          background: #e63946;
          color: #fff; border: none;
          padding: 12px 28px; border-radius: 30px;
          font-size: 14px; font-weight: 700;
          cursor: pointer; letter-spacing: 0.04em;
          transition: transform 0.2s, box-shadow 0.2s;
          box-shadow: 0 8px 24px rgba(230,57,70,0.4);
          font-family: 'DM Sans', sans-serif;
        }
        .hero-play-btn:hover {
          transform: scale(1.04);
          box-shadow: 0 12px 32px rgba(230,57,70,0.55);
        }

        .search-input {
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.1);
          color: #f0efeb;
          padding: 10px 16px 10px 40px;
          border-radius: 30px;
          font-size: 13px;
          font-family: 'DM Sans', sans-serif;
          width: 260px;
          transition: all 0.2s;
          outline: none;
        }
        .search-input:focus {
          border-color: rgba(230,57,70,0.5);
          background: rgba(230,57,70,0.05);
          box-shadow: 0 0 0 3px rgba(230,57,70,0.1);
          width: 300px;
        }
        .search-input::placeholder { color: rgba(240,239,235,0.3); }

        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.8); }
        }

        .studio-bar {
          height: 4px;
          border-radius: 2px;
          background: linear-gradient(90deg, #e63946, #ff6b6b);
          transition: width 0.8s ease;
        }

        .section-title {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 28px;
          letter-spacing: 0.08em;
          color: #f0efeb;
          margin: 0 0 20px;
        }

        /* ── RESPONSIVE CLASSES ── */
        .dashboard-container {
          padding: 40px 48px 80px;
        }
        .hero-content {
          padding: 48px;
        }
        .hero-title {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 56px;
          margin: 0 0 8px;
          letter-spacing: 0.04em;
          line-height: 1;
          max-width: 500px;
          background: linear-gradient(90deg, #fff 0%, rgba(255,255,255,0.8) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .hero-img {
          position: absolute;
          right: 0;
          top: 0;
          height: 100%;
          width: 60%;
          object-fit: cover;
          object-position: top center;
        }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: 16px;
          margin-bottom: 40px;
        }
        .charts-grid {
          display: grid;
          grid-template-columns: 1fr 340px;
          gap: 20px;
          margin-bottom: 40px;
        }
        .studios-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 24px;
        }

        /* ── MEDIA QUERIES ── */
        @media (max-width: 1024px) {
          .charts-grid {
            grid-template-columns: 1fr;
          }
        }
        @media (max-width: 768px) {
          .dashboard-container {
            padding: 24px 16px 80px;
          }
          .hero-content {
            padding: 32px 24px;
          }
          .hero-title {
            font-size: 40px;
          }
          .hero-img {
            width: 100%;
            opacity: 0.4;
          }
          .stats-grid {
            grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
          }
        }
        @media (max-width: 480px) {
          .hero-title {
            font-size: 32px;
          }
          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      `}</style>

      <div className="dashboard-container">
        {/* ── HERO BANNER ── */}
        {featured && (
          <div
            className={`dash-fadeup ${mounted ? "visible" : ""}`}
            style={{ transitionDelay: "0.05s", marginBottom: 40 }}
          >
            <div
              style={{
                borderRadius: 24,
                overflow: "hidden",
                position: "relative",
                height: 340,
                background: featured.coverImageUrl
                  ? `linear-gradient(90deg, rgba(8,6,8,0.98) 0%, rgba(8,6,8,0.75) 55%, rgba(8,6,8,0.2) 100%)`
                  : "linear-gradient(135deg, #1a0a0a 0%, #2d0d14 100%)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              {/* BG Image */}
              {featured.coverImageUrl && (
                <img className="hero-img" src={featured.coverImageUrl} alt="" />
              )}

              {/* Gradient overlay */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "linear-gradient(90deg, #080608 35%, rgba(8,6,8,0.6) 65%, transparent 100%)",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: "50%",
                  background: "linear-gradient(to top, #080608, transparent)",
                }}
              />

              {/* Content */}
              <div
                className="hero-content"
                style={{
                  position: "relative",
                  zIndex: 2,
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    marginBottom: 12,
                  }}
                >
                  <div
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: "#e63946",
                      animation: "pulse-dot 2s ease infinite",
                      boxShadow: "0 0 8px #e63946",
                    }}
                  />
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: "0.2em",
                      color: "#e63946",
                      textTransform: "uppercase",
                    }}
                  >
                    Featured
                  </span>
                </div>

                <h1 className="hero-title">{featured.title}</h1>

                {featured.romajiTitle && (
                  <div
                    style={{
                      fontFamily: "'Noto Serif JP', serif",
                      fontSize: 13,
                      color: "rgba(255,255,255,0.4)",
                      marginBottom: 12,
                    }}
                  >
                    {featured.romajiTitle}
                  </div>
                )}

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                    marginBottom: 24,
                    flexWrap: "wrap",
                  }}
                >
                  {featured.rating > 0 && (
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 6 }}
                    >
                      <StarRating value={featured.rating} />
                      <span
                        style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}
                      >
                        {featured.rating}/10
                      </span>
                    </div>
                  )}
                  {featured.status && (
                    <span
                      style={{
                        padding: "3px 10px",
                        borderRadius: 6,
                        background: STATUS_COLORS[featured.status]
                          ? `${STATUS_COLORS[featured.status]}22`
                          : "rgba(255,255,255,0.07)",
                        border: `1px solid ${STATUS_COLORS[featured.status] || "rgba(255,255,255,0.1)"}44`,
                        color:
                          STATUS_COLORS[featured.status] ||
                          "rgba(255,255,255,0.5)",
                        fontSize: 11,
                        fontWeight: 600,
                      }}
                    >
                      {featured.status}
                    </span>
                  )}
                  {featured.studio && (
                    <span
                      style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}
                    >
                      {featured.studio}
                    </span>
                  )}
                </div>

                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  <button
                    className="hero-play-btn"
                    onClick={() =>
                      navigate(`/animes/${featured._id || featured.id}`)
                    }
                  >
                    ▶ Watch Now
                  </button>
                  <button
                    onClick={() =>
                      navigate(`/animes/${featured._id || featured.id}`)
                    }
                    style={{
                      background: "rgba(255,255,255,0.08)",
                      border: "1px solid rgba(255,255,255,0.15)",
                      color: "rgba(255,255,255,0.8)",
                      padding: "12px 24px",
                      borderRadius: 30,
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: "pointer",
                      fontFamily: "'DM Sans', sans-serif",
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background =
                        "rgba(255,255,255,0.14)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background =
                        "rgba(255,255,255,0.08)";
                    }}
                  >
                    ℹ Details
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── STATS ROW ── */}
        <div
          className={`dash-fadeup stats-grid ${mounted ? "visible" : ""}`}
          style={{ transitionDelay: "0.1s" }}
        >
          {[
            {
              label: "Total Anime",
              value: animes.length,
              icon: "📚",
              color: "#818cf8",
            },
            {
              label: "Completed",
              value: completed,
              icon: "✅",
              color: "#4ade80",
            },
            {
              label: "Watching",
              value: watching,
              icon: "▶️",
              color: "#e63946",
            },
            {
              label: "Plan to Watch",
              value: planToWatch,
              icon: "📝",
              color: "#facc15",
            },
            {
              label: "Episodes Watched",
              value: totalEps,
              icon: "🎬",
              color: "#22d3ee",
            },
          ].map((s, i) => (
            <div
              key={s.label}
              className="stat-card"
              style={{ transitionDelay: `${i * 0.04}s` }}
            >
              <div style={{ fontSize: 22, marginBottom: 8 }}>{s.icon}</div>
              <div
                style={{
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: 34,
                  color: s.color,
                  lineHeight: 1,
                  marginBottom: 4,
                }}
              >
                {s.value}
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: "rgba(240,239,235,0.4)",
                  fontWeight: 500,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                }}
              >
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {/* ── CHARTS ROW ── */}
        <div
          className={`dash-fadeup charts-grid ${mounted ? "visible" : ""}`}
          style={{ transitionDelay: "0.15s" }}
        >
          {/* Area Chart */}
          <div
            style={{
              background: "rgba(255,255,255,0.025)",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 20,
              padding: "24px 24px 12px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 20,
                flexWrap: "wrap",
                gap: 10,
              }}
            >
              <div>
                <h3
                  style={{ margin: "0 0 2px", fontSize: 16, fontWeight: 700 }}
                >
                  Activity Overview
                </h3>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>
                  Completed & watching over time
                </div>
              </div>
              <div style={{ display: "flex", gap: 16, fontSize: 11 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: "#4ade80",
                    }}
                  />
                  <span style={{ color: "rgba(255,255,255,0.5)" }}>
                    Completed
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: "#e63946",
                    }}
                  />
                  <span style={{ color: "rgba(255,255,255,0.5)" }}>
                    Watching
                  </span>
                </div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart
                data={areaData}
                margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="gCompleted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4ade80" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#4ade80" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gWatching" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#e63946" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#e63946" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="month"
                  tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="completed"
                  stroke="#4ade80"
                  strokeWidth={2}
                  fill="url(#gCompleted)"
                  dot={false}
                />
                <Area
                  type="monotone"
                  dataKey="watching"
                  stroke="#e63946"
                  strokeWidth={2}
                  fill="url(#gWatching)"
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Donut + Studios */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Donut chart */}
            <div
              style={{
                background: "rgba(255,255,255,0.025)",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 20,
                padding: "20px",
                flex: 1,
              }}
            >
              <h3 style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 700 }}>
                Status Breakdown
              </h3>
              {statusData.length > 0 ? (
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <PieChart width={100} height={100}>
                    <Pie
                      data={statusData}
                      cx={45}
                      cy={45}
                      innerRadius={28}
                      outerRadius={46}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {statusData.map((entry, i) => (
                        <Cell
                          key={i}
                          fill={STATUS_COLORS[entry.name] || "#94a3b8"}
                        />
                      ))}
                    </Pie>
                  </PieChart>
                  <div
                    style={{
                      flex: 1,
                      display: "flex",
                      flexDirection: "column",
                      gap: 6,
                    }}
                  >
                    {statusData.map((item) => (
                      <div
                        key={item.name}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <div
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: "50%",
                            flexShrink: 0,
                            background: STATUS_COLORS[item.name] || "#94a3b8",
                          }}
                        />
                        <span
                          style={{
                            fontSize: 11,
                            color: "rgba(255,255,255,0.55)",
                            flex: 1,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {item.name}
                        </span>
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            color: STATUS_COLORS[item.name] || "#94a3b8",
                          }}
                        >
                          {item.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    textAlign: "center",
                    color: "rgba(255,255,255,0.25)",
                    fontSize: 12,
                    padding: "20px 0",
                  }}
                >
                  Add anime to see stats
                </div>
              )}
            </div>

            {/* Avg rating */}
            <div
              style={{
                background:
                  "linear-gradient(135deg, rgba(230,57,70,0.12) 0%, rgba(230,57,70,0.04) 100%)",
                border: "1px solid rgba(230,57,70,0.25)",
                borderRadius: 16,
                padding: "16px 20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "0.12em",
                    color: "#e63946",
                    textTransform: "uppercase",
                    marginBottom: 4,
                  }}
                >
                  Avg. Rating
                </div>
                <div
                  style={{
                    fontFamily: "'Bebas Neue', sans-serif",
                    fontSize: 36,
                    color: "#e63946",
                    lineHeight: 1,
                  }}
                >
                  {avgRating}
                </div>
                <div
                  style={{
                    fontSize: 10,
                    color: "rgba(255,255,255,0.35)",
                    marginTop: 2,
                  }}
                >
                  out of 10.0
                </div>
              </div>
              <div style={{ fontSize: 42 }}>⭐</div>
            </div>
          </div>
        </div>

        {/* ── TOP STUDIOS ── */}
        {topStudios.length > 0 && (
          <div
            className={`dash-fadeup ${mounted ? "visible" : ""}`}
            style={{ transitionDelay: "0.2s", marginBottom: 40 }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 20,
              }}
            >
              <h2 className="section-title" style={{ margin: 0 }}>
                Top Studios
              </h2>
            </div>
            <div
              className="studios-grid"
              style={{
                background: "rgba(255,255,255,0.025)",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 20,
                padding: "20px 28px",
              }}
            >
              {topStudios.map(([studio, count], i) => {
                const hues = [330, 270, 220, 160, 45];
                const pct = Math.round((count / animes.length) * 100);
                return (
                  <div
                    key={studio}
                    style={{ display: "flex", flexDirection: "column", gap: 8 }}
                  >
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 10 }}
                    >
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: "50%",
                          background: `hsl(${hues[i]}, 60%, 35%)`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 15,
                          fontWeight: 800,
                          flexShrink: 0,
                        }}
                      >
                        {studio.charAt(0)}
                      </div>
                      <div>
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: 600,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            maxWidth: 100,
                          }}
                        >
                          {studio}
                        </div>
                        <div
                          style={{
                            fontSize: 10,
                            color: "rgba(255,255,255,0.35)",
                          }}
                        >
                          {count} title{count !== 1 ? "s" : ""}
                        </div>
                      </div>
                    </div>
                    <div
                      style={{
                        height: 4,
                        background: "rgba(255,255,255,0.07)",
                        borderRadius: 2,
                        overflow: "hidden",
                      }}
                    >
                      <div
                        className="studio-bar"
                        style={{
                          width: `${pct}%`,
                          background: `hsl(${hues[i]}, 60%, 55%)`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── ANIME GRID ── */}
        <div
          className={`dash-fadeup ${mounted ? "visible" : ""}`}
          style={{ transitionDelay: "0.25s" }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 20,
              flexWrap: "wrap",
              gap: 16,
            }}
          >
            <h2 className="section-title" style={{ margin: 0 }}>
              {searchQuery ? `Results for "${searchQuery}"` : "Your Library"}
            </h2>
            <div
              style={{
                display: "flex",
                gap: 8,
                overflowX: "auto",
                paddingBottom: 4,
                WebkitOverflowScrolling: "touch",
              }}
            >
              {statuses.map((s) => (
                <button
                  key={s}
                  className="status-pill"
                  onClick={() => setActiveStatus(s)}
                  style={{
                    background:
                      activeStatus === s
                        ? (STATUS_COLORS[s] || "#e63946") + "22"
                        : "rgba(255,255,255,0.04)",
                    borderColor:
                      activeStatus === s
                        ? (STATUS_COLORS[s] || "#e63946") + "88"
                        : "rgba(255,255,255,0.08)",
                    color:
                      activeStatus === s
                        ? STATUS_COLORS[s] || "#e63946"
                        : "rgba(240,239,235,0.5)",
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {displayed.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "80px 0",
                color: "rgba(255,255,255,0.25)",
              }}
            >
              <div style={{ fontSize: 48, marginBottom: 16 }}>🎌</div>
              <div
                style={{
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: 24,
                  letterSpacing: "0.08em",
                  marginBottom: 8,
                }}
              >
                {searchQuery ? "No results found" : "Your library is empty"}
              </div>
              <div style={{ fontSize: 13 }}>
                {searchQuery
                  ? "Try a different search term"
                  : "Add some anime to get started"}
              </div>
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
                gap: 16,
              }}
            >
              {displayed.map((anime, i) => {
                const id = anime._id || anime.id;
                const fav = isFavorite(id);
                return (
                  <div
                    key={id || i}
                    className="anime-card"
                    onClick={() => navigate(`/animes/${id}`)}
                  >
                    <div style={{ position: "relative", height: 240 }}>
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
                        />
                      ) : (
                        <div
                          style={{
                            width: "100%",
                            height: "100%",
                            background: `linear-gradient(135deg, hsl(${i * 40}, 40%, 18%), hsl(${i * 40 + 30}, 40%, 10%))`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 48,
                            opacity: 0.5,
                          }}
                        >
                          🎌
                        </div>
                      )}
                      <div
                        style={{
                          position: "absolute",
                          inset: 0,
                          background:
                            "linear-gradient(to top, rgba(8,6,8,1) 0%, rgba(8,6,8,0.4) 50%, transparent 100%)",
                        }}
                      />

                      {/* Fav button */}
                      <button
                        className="fav-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(anime);
                        }}
                        style={{
                          position: "absolute",
                          top: 8,
                          right: 8,
                          background: fav
                            ? "rgba(230,57,70,0.9)"
                            : "rgba(0,0,0,0.6)",
                        }}
                      >
                        {fav ? "♥" : "♡"}
                      </button>

                      {/* Status badge */}
                      <div
                        style={{
                          position: "absolute",
                          top: 8,
                          left: 8,
                          background: `${STATUS_COLORS[anime.status] || "#94a3b8"}22`,
                          border: `1px solid ${STATUS_COLORS[anime.status] || "#94a3b8"}44`,
                          color: STATUS_COLORS[anime.status] || "#94a3b8",
                          fontSize: 9,
                          fontWeight: 700,
                          padding: "3px 8px",
                          borderRadius: 4,
                          textTransform: "uppercase",
                          letterSpacing: "0.08em",
                        }}
                      >
                        {anime.status?.split(" ")[0]}
                      </div>

                      {/* Rating */}
                      {anime.rating > 0 && (
                        <div
                          style={{
                            position: "absolute",
                            bottom: 8,
                            right: 8,
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
                    </div>

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
                      {anime.studio && (
                        <div
                          style={{
                            fontSize: 11,
                            color: "rgba(255,255,255,0.35)",
                          }}
                        >
                          {anime.studio}
                        </div>
                      )}
                      {anime.totalEpisodes > 0 && (
                        <div style={{ marginTop: 8 }}>
                          <div
                            style={{
                              height: 2,
                              background: "rgba(255,255,255,0.06)",
                              borderRadius: 1,
                              overflow: "hidden",
                            }}
                          >
                            <div
                              style={{
                                height: "100%",
                                width: `${Math.min(100, ((anime.episodesWatched || 0) / anime.totalEpisodes) * 100)}%`,
                                background: "#e63946",
                                borderRadius: 1,
                              }}
                            />
                          </div>
                          <div
                            style={{
                              fontSize: 10,
                              color: "rgba(255,255,255,0.25)",
                              marginTop: 4,
                            }}
                          >
                            {anime.episodesWatched}/{anime.totalEpisodes} eps
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {animes.length > 8 && (
            <div style={{ textAlign: "center", marginTop: 32 }}>
              <button
                onClick={() => navigate("/top-animes")}
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "rgba(255,255,255,0.6)",
                  padding: "10px 32px",
                  borderRadius: 20,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "'DM Sans', sans-serif",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "rgba(230,57,70,0.4)";
                  e.currentTarget.style.color = "#e63946";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
                  e.currentTarget.style.color = "rgba(255,255,255,0.6)";
                }}
              >
                View all {animes.length} anime →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
