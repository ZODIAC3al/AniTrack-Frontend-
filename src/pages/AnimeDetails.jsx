import { useEffect, useRef, useState } from "react";
import { useLoaderData, useNavigate } from "react-router-dom";
import { useAnime } from "../context/AnimeConextProvider.jsx";
import AnimeForm from "../components/AnimeForm.jsx";

const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));

function calcPct(watched, total) {
  if (!total) return 0;
  return clamp(Math.round((watched / total) * 100), 0, 100);
}

const STATUS_MAP = {
  Completed: {
    bg: "rgba(16,185,129,0.12)",
    border: "rgba(16,185,129,0.45)",
    text: "#34d399",
    dot: "#34d399",
  },
  Watching: {
    bg: "rgba(59,130,246,0.12)",
    border: "rgba(59,130,246,0.45)",
    text: "#60a5fa",
    dot: "#60a5fa",
  },
  default: {
    bg: "rgba(230,57,70,0.12)",
    border: "rgba(230,57,70,0.45)",
    text: "#e63946",
    dot: "#e63946",
  },
};
const ss = (s) => STATUS_MAP[s] ?? STATUS_MAP.default;

async function fetchAniListSynopsis(title) {
  try {
    const query = `query ($s: String) { Media(search: $s, type: ANIME) { description(asHtml: false) } }`;
    const res = await fetch("https://graphql.anilist.co", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, variables: { s: title } }),
    });
    const { data } = await res.json();
    return data?.Media?.description ?? null;
  } catch {
    return null;
  }
}

function Tag({ children }) {
  return (
    <span
      style={{
        display: "inline-block",
        background: "rgba(230,57,70,0.1)",
        border: "1px solid rgba(230,57,70,0.3)",
        color: "#e63946",
        fontSize: 10,
        fontFamily: "'Inter',sans-serif",
        fontWeight: 600,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        padding: "4px 12px",
        borderRadius: 20,
      }}
    >
      {children}
    </span>
  );
}

function MetaRow({ label, value, accent = "#e63946" }) {
  if (!value) return null;
  return (
    <div>
      <div
        style={{
          fontSize: 9,
          fontFamily: "'Inter',sans-serif",
          fontWeight: 700,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: accent,
          marginBottom: 4,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 13,
          fontFamily: "'Inter',sans-serif",
          color: "#f0efeb",
          fontWeight: 500,
        }}
      >
        {value}
      </div>
    </div>
  );
}

function Pill({ label, value, accent = "#e63946" }) {
  if (!value) return null;
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 10,
        padding: "12px 18px",
        minWidth: 100,
      }}
    >
      <div
        style={{
          fontSize: 9,
          fontFamily: "'Inter',sans-serif",
          fontWeight: 700,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: accent,
          marginBottom: 6,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 15,
          fontWeight: 700,
          fontFamily: "'Noto Serif JP',serif",
          color: "#f0efeb",
        }}
      >
        {value}
      </div>
    </div>
  );
}

function ProgressBar({ watched, total }) {
  const p = calcPct(watched, total);
  const fillRef = useRef(null);
  useEffect(() => {
    if (!fillRef.current) return;
    fillRef.current.animate([{ width: "0%" }, { width: `${p}%` }], {
      duration: 900,
      delay: 500,
      easing: "cubic-bezier(0.16,1,0.3,1)",
      fill: "forwards",
    });
  }, [p]);
  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 8,
        }}
      >
        <span
          style={{
            fontSize: 11,
            fontFamily: "'Inter',sans-serif",
            color: "rgba(240,239,235,0.5)",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
          }}
        >
          Episode Progress
        </span>
        <span
          style={{
            fontSize: 13,
            fontFamily: "'Inter',sans-serif",
            fontWeight: 600,
            color: "#f0efeb",
          }}
        >
          {watched}
          <span style={{ color: "rgba(240,239,235,0.35)", fontWeight: 400 }}>
            {" "}
            / {total}
          </span>
          <span style={{ color: "#ffd166", marginLeft: 8, fontSize: 11 }}>
            ({p}%)
          </span>
        </span>
      </div>
      <div
        style={{
          height: 6,
          background: "rgba(255,255,255,0.07)",
          borderRadius: 3,
          overflow: "hidden",
        }}
      >
        <div
          ref={fillRef}
          style={{
            height: "100%",
            width: "0%",
            background: "linear-gradient(90deg, #e63946 0%, #ffd166 100%)",
            borderRadius: 3,
            boxShadow: "0 0 12px rgba(230,57,70,0.5)",
          }}
        />
      </div>
    </div>
  );
}

// Replace this function in AnimeDetails.jsx
function RatingRing({ rating }) {
  const r = 38;
  const circ = 2 * Math.PI * r;

  // THE FIX: Safely check if the rating is a valid number.
  // If it's "HD", "TBA", or undefined, it defaults to 0.
  const parsedRating = parseFloat(rating);
  const numRating = isNaN(parsedRating) ? 0 : parsedRating;
  const dash = (numRating / 10) * circ;

  const ringRef = useRef(null);

  useEffect(() => {
    if (!ringRef.current) return;
    ringRef.current.animate(
      [{ strokeDashoffset: circ }, { strokeDashoffset: circ - dash }],
      {
        duration: 1000,
        delay: 300,
        easing: "cubic-bezier(0.16,1,0.3,1)",
        fill: "forwards",
      },
    );
  }, [circ, dash]);

  return (
    <div style={{ position: "relative", width: 96, height: 96, flexShrink: 0 }}>
      <svg
        width="96"
        height="96"
        viewBox="0 0 96 96"
        style={{ transform: "rotate(-90deg)" }}
      >
        <circle
          cx="48"
          cy="48"
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.07)"
          strokeWidth="6"
        />
        <circle
          ref={ringRef}
          cx="48"
          cy="48"
          r={r}
          fill="none"
          stroke="url(#rg)"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ}
        />
        <defs>
          <linearGradient id="rg" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#e63946" />
            <stop offset="100%" stopColor="#ffd166" />
          </linearGradient>
        </defs>
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span
          style={{
            fontSize: 20,
            fontWeight: 900,
            fontFamily: "'Noto Serif JP',serif",
            color: "#ffd166",
            lineHeight: 1,
          }}
        >
          {numRating > 0 ? numRating : "—"}
        </span>
        <span
          style={{
            fontSize: 9,
            fontFamily: "'Inter',sans-serif",
            color: "rgba(240,239,235,0.4)",
            letterSpacing: "0.1em",
            marginTop: 2,
          }}
        >
          / 10
        </span>
      </div>
    </div>
  );
}

export default function AnimeDetails() {
  const raw = useLoaderData();
  const anime = Array.isArray(raw) ? raw[0] : (raw?.anime ?? raw);
  const navigate = useNavigate();
  const { toggleFavorite, isFavorite, deleteAnime } = useAnime();

  const cardRef = useRef(null);
  const infoRef = useRef(null);
  const [synopsis, setSynopsis] = useState(null);
  const [showEdit, setShowEdit] = useState(false);
  const [delConfirm, setDelConfirm] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    [cardRef.current, infoRef.current].filter(Boolean).forEach((el, i) => {
      el.animate(
        [
          { opacity: 0, transform: "translateY(32px)" },
          { opacity: 1, transform: "translateY(0)" },
        ],
        {
          duration: 800,
          delay: 150 + i * 120,
          easing: "cubic-bezier(0.16,1,0.3,1)",
          fill: "forwards",
        },
      );
    });
  }, [anime]);

  useEffect(() => {
    if (!anime?.title || anime?.description) return;
    fetchAniListSynopsis(anime.title).then(setSynopsis);
  }, [anime]);

  if (!anime) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#0a0404",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "rgba(240,239,235,0.4)",
          fontFamily: "'Noto Serif JP',serif",
          fontSize: 18,
        }}
      >
        Anime not found.
      </div>
    );
  }

  if (showEdit) {
    return <AnimeForm editData={anime} onClose={() => setShowEdit(false)} />;
  }

  const id = anime._id ?? anime.id;
  const title = anime.title ?? "Untitled";
  const romajiTitle = anime.romajiTitle;
  const status = anime.status ?? "Unknown";
  const rating = anime.rating;
  const releaseYear = anime.releaseYear;
  const studio = anime.studio;
  const description = anime.description || synopsis;
  const coverImageUrl = anime.coverImageUrl ?? anime.coverImage ?? anime.image;
  const episodesWatched = anime.episodesWatched ?? 0;
  const totalEpisodes = anime.totalEpisodes ?? 0;
  const historicalSetting = anime.historicalSetting ?? anime.setting;
  const rawGenre = anime.genre ?? anime.genres;
  const genres = rawGenre
    ? Array.isArray(rawGenre)
      ? rawGenre
      : String(rawGenre)
          .split(/[,•\/]/)
          .map((g) => g.trim())
          .filter(Boolean)
    : [];

  const style = ss(status);
  const remaining = totalEpisodes - episodesWatched;
  const resumeEp = Math.min(episodesWatched + 1, totalEpisodes || 1);
  const fav = isFavorite(id);
  const goWatch = (ep = 1) => navigate(`/animes/${id}/watch?ep=${ep}`);

  const handleDelete = async () => {
    if (!delConfirm) {
      setDelConfirm(true);
      setTimeout(() => setDelConfirm(false), 3000);
      return;
    }
    await deleteAnime(id);
    navigate("/top-animes");
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0a0404",
        color: "#f0efeb",
        overflowX: "hidden",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+JP:wght@400;600;700;900&family=Inter:wght@300;400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        .kd-back:hover { background: rgba(230,57,70,0.12) !important; border-color: rgba(230,57,70,0.5) !important; transform: translateX(-2px); }
        .kd-btn-red:hover { background: #c1121f !important; box-shadow: 0 8px 24px rgba(193,18,31,0.4) !important; }
        .kd-btn-ghost:hover { background: rgba(255,255,255,0.1) !important; }
        .kd-btn-gold:hover { border-color: rgba(255,209,102,0.6) !important; color: #ffd166 !important; }
        @media (max-width: 900px) { .kd-layout { flex-direction: column !important; } .kd-cover-col { width: 100% !important; align-items: center !important; } .kd-title { font-size: 30px !important; } }
      `}</style>

      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="kd-back"
        style={{
          position: "fixed",
          top: 72,
          left: 32,
          zIndex: 200,
          display: "flex",
          alignItems: "center",
          gap: 8,
          background: "rgba(10,4,4,0.75)",
          backdropFilter: "blur(14px)",
          border: "1px solid rgba(230,57,70,0.25)",
          borderRadius: 10,
          color: "#f0efeb",
          fontFamily: "'Inter',sans-serif",
          fontSize: 13,
          fontWeight: 500,
          padding: "8px 18px 8px 12px",
          cursor: "pointer",
          transition: "all 0.2s ease",
        }}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path
            d="M10 3L5 8l5 5"
            stroke="#e63946"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Back
      </button>

      {/* Backdrop */}
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "55vh",
          minHeight: 340,
          overflow: "hidden",
        }}
      >
        {coverImageUrl && (
          <div
            style={{
              position: "absolute",
              inset: "-10%",
              backgroundImage: `url(${coverImageUrl})`,
              backgroundSize: "cover",
              backgroundPosition: "center top",
              filter: "blur(28px) brightness(0.22) saturate(1.5)",
              transform: "scale(1.1)",
            }}
          />
        )}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to bottom, rgba(10,4,4,0.2) 0%, rgba(10,4,4,0) 40%, rgba(10,4,4,1) 100%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to right, rgba(10,4,4,0.7) 0%, transparent 70%)",
          }}
        />
      </div>

      {/* Content */}
      <div
        style={{
          maxWidth: 1120,
          margin: "0 auto",
          padding: "0 48px 80px",
          marginTop: "-36vh",
          position: "relative",
          zIndex: 10,
        }}
      >
        <div
          className="kd-layout"
          style={{ display: "flex", gap: 48, alignItems: "flex-start" }}
        >
          {/* Cover column */}
          <div
            ref={cardRef}
            className="kd-cover-col"
            style={{
              flexShrink: 0,
              width: 260,
              display: "flex",
              flexDirection: "column",
              opacity: 0,
            }}
          >
            <div
              style={{
                position: "relative",
                width: "100%",
                borderRadius: 16,
                overflow: "hidden",
                boxShadow:
                  "0 28px 64px rgba(0,0,0,0.75), 0 0 0 1px rgba(230,57,70,0.18)",
              }}
            >
              {coverImageUrl ? (
                <img
                  src={coverImageUrl}
                  alt={title}
                  style={{
                    width: "100%",
                    aspectRatio: "3/4",
                    objectFit: "cover",
                    display: "block",
                  }}
                  onError={(e) => {
                    e.target.src =
                      "https://placehold.co/260x346/1a0a0a/e63946?text=No+Image";
                  }}
                />
              ) : (
                <div
                  style={{
                    width: "100%",
                    aspectRatio: "3/4",
                    background: "rgba(230,57,70,0.08)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "rgba(240,239,235,0.2)",
                    fontSize: 13,
                    fontFamily: "'Inter',sans-serif",
                  }}
                >
                  No Cover
                </div>
              )}
              <div
                style={{
                  position: "absolute",
                  top: 12,
                  left: 12,
                  background: style.bg,
                  border: `1px solid ${style.border}`,
                  color: style.text,
                  fontSize: 9,
                  fontFamily: "'Inter',sans-serif",
                  fontWeight: 700,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  padding: "4px 10px",
                  borderRadius: 12,
                  backdropFilter: "blur(8px)",
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                }}
              >
                <span
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: "50%",
                    background: style.dot,
                    boxShadow: `0 0 6px ${style.dot}`,
                    display: "inline-block",
                  }}
                />
                {status}
              </div>
              {rating && (
                <div
                  style={{
                    position: "absolute",
                    top: 12,
                    right: 12,
                    background: "rgba(10,4,4,0.75)",
                    backdropFilter: "blur(6px)",
                    border: "1px solid rgba(255,209,102,0.3)",
                    borderRadius: 8,
                    padding: "4px 8px",
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <span style={{ color: "#ffd166", fontSize: 11 }}>★</span>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: "#f0efeb",
                      fontFamily: "'Inter',sans-serif",
                    }}
                  >
                    {rating}
                  </span>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div
              style={{
                marginTop: 16,
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              <button
                className="kd-btn-red"
                onClick={() => goWatch(1)}
                style={{
                  width: "100%",
                  background: "#e63946",
                  border: "none",
                  color: "#fff",
                  fontFamily: "'Inter',sans-serif",
                  fontWeight: 600,
                  fontSize: 13,
                  padding: "12px 0",
                  borderRadius: 10,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  transition: "all 0.22s ease",
                  boxShadow: "0 4px 16px rgba(193,18,31,0.25)",
                }}
              >
                <span style={{ fontSize: 10 }}>▶</span> Watch Now
              </button>
              <button
                className="kd-btn-ghost"
                onClick={() => toggleFavorite(id)}
                style={{
                  width: "100%",
                  background: fav
                    ? "rgba(230,57,70,0.12)"
                    : "rgba(255,255,255,0.06)",
                  border: `1px solid ${fav ? "rgba(230,57,70,0.4)" : "rgba(255,255,255,0.12)"}`,
                  color: fav ? "#e63946" : "#f0efeb",
                  fontFamily: "'Inter',sans-serif",
                  fontWeight: 500,
                  fontSize: 13,
                  padding: "11px 0",
                  borderRadius: 10,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  transition: "all 0.22s ease",
                  backdropFilter: "blur(6px)",
                }}
              >
                {fav ? "♥ Favorited" : "♡ Favourite"}
              </button>
              <button
                onClick={() => setShowEdit(true)}
                style={{
                  width: "100%",
                  background: "transparent",
                  border: "1px solid rgba(255,209,102,0.22)",
                  color: "rgba(255,209,102,0.65)",
                  fontFamily: "'Inter',sans-serif",
                  fontWeight: 500,
                  fontSize: 13,
                  padding: "11px 0",
                  borderRadius: 10,
                  cursor: "pointer",
                  transition: "all 0.22s ease",
                }}
                className="kd-btn-gold"
              >
                ✎ Edit Entry
              </button>
              <button
                onClick={handleDelete}
                style={{
                  width: "100%",
                  background: delConfirm
                    ? "rgba(239,68,68,0.15)"
                    : "transparent",
                  border: `1px solid ${delConfirm ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.08)"}`,
                  color: delConfirm ? "#f87171" : "rgba(240,239,235,0.3)",
                  fontFamily: "'Inter',sans-serif",
                  fontWeight: 500,
                  fontSize: 12,
                  padding: "9px 0",
                  borderRadius: 10,
                  cursor: "pointer",
                  transition: "all 0.22s ease",
                }}
              >
                {delConfirm ? "⚠ Confirm Delete?" : "✕ Delete"}
              </button>
            </div>

            <div
              style={{
                marginTop: 20,
                width: "100%",
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 12,
                padding: "18px 18px",
                display: "flex",
                flexDirection: "column",
                gap: 16,
              }}
            >
              <MetaRow label="Studio" value={studio} />
              <MetaRow label="Year" value={releaseYear} accent="#ffd166" />
              <MetaRow
                label="Episodes"
                value={totalEpisodes ? `${totalEpisodes} eps` : null}
                accent="#60a5fa"
              />
              <MetaRow
                label="Setting"
                value={historicalSetting}
                accent="#a78bfa"
              />
            </div>
          </div>

          {/* Info column */}
          <div
            ref={infoRef}
            className="kd-info-col"
            style={{ flex: 1, paddingTop: 80, opacity: 0 }}
          >
            {genres.length > 0 && (
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 8,
                  marginBottom: 20,
                }}
              >
                {genres.map((g) => (
                  <Tag key={g}>{g}</Tag>
                ))}
              </div>
            )}

            <h1
              className="kd-title"
              style={{
                fontFamily: "'Noto Serif JP',serif",
                fontSize: 44,
                fontWeight: 900,
                color: "#f0efeb",
                lineHeight: 1.08,
                marginBottom: 10,
                letterSpacing: "-0.01em",
              }}
            >
              {title}
            </h1>
            <p
              style={{
                fontFamily: "'Inter',sans-serif",
                fontSize: 14,
                color: "rgba(240,239,235,0.38)",
                marginBottom: 32,
                letterSpacing: "0.04em",
              }}
            >
              {[romajiTitle, releaseYear].filter(Boolean).join(" · ")}
            </p>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 28,
                marginBottom: 36,
                flexWrap: "wrap",
              }}
            >
              <RatingRing rating={rating} />
              <div
                style={{ display: "flex", flexDirection: "column", gap: 10 }}
              >
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    background: style.bg,
                    border: `1px solid ${style.border}`,
                    color: style.text,
                    fontSize: 11,
                    fontFamily: "'Inter',sans-serif",
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    padding: "6px 14px",
                    borderRadius: 20,
                  }}
                >
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: style.dot,
                      boxShadow: `0 0 8px ${style.dot}`,
                    }}
                  />
                  {status}
                </div>
                {rating && (
                  <div
                    style={{
                      fontSize: 12,
                      fontFamily: "'Inter',sans-serif",
                      color: "rgba(240,239,235,0.4)",
                    }}
                  >
                    <span style={{ color: "#ffd166", fontWeight: 600 }}>
                      ★ {rating}
                    </span>{" "}
                    · Your Rating
                  </div>
                )}
              </div>
            </div>

            <div
              style={{
                height: 1,
                background:
                  "linear-gradient(to right, rgba(230,57,70,0.35), transparent)",
                marginBottom: 32,
              }}
            />

            {description && (
              <div style={{ marginBottom: 36 }}>
                <h3
                  style={{
                    fontFamily: "'Noto Serif JP',serif",
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#e63946",
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    marginBottom: 14,
                  }}
                >
                  Synopsis
                </h3>
                <p
                  style={{
                    fontFamily: "'Inter',sans-serif",
                    fontSize: 14,
                    lineHeight: 1.85,
                    color: "rgba(240,239,235,0.7)",
                  }}
                >
                  {description}
                </p>
              </div>
            )}

            <div
              style={{
                display: "flex",
                gap: 12,
                flexWrap: "wrap",
                marginBottom: 36,
              }}
            >
              <Pill label="Studio" value={studio} />
              <Pill label="Year" value={releaseYear} accent="#ffd166" />
              <Pill label="Episodes" value={totalEpisodes} accent="#60a5fa" />
              {historicalSetting && (
                <Pill
                  label="Setting"
                  value={historicalSetting.split(" ").slice(0, 2).join(" ")}
                  accent="#a78bfa"
                />
              )}
            </div>

            {totalEpisodes > 0 && (
              <div
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: 14,
                  padding: "20px 24px",
                  marginBottom: 36,
                }}
              >
                <ProgressBar watched={episodesWatched} total={totalEpisodes} />
                <p
                  style={{
                    marginTop: 10,
                    fontSize: 11,
                    fontFamily: "'Inter',sans-serif",
                    color: "rgba(240,239,235,0.3)",
                  }}
                >
                  {episodesWatched === totalEpisodes
                    ? "🎉 You've finished this anime!"
                    : `${remaining} episode${remaining !== 1 ? "s" : ""} remaining`}
                </p>
              </div>
            )}

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <button
                className="kd-btn-red"
                onClick={() => goWatch(resumeEp)}
                style={{
                  background: "#e63946",
                  border: "none",
                  color: "#fff",
                  fontFamily: "'Inter',sans-serif",
                  fontWeight: 600,
                  fontSize: 13,
                  padding: "12px 28px",
                  borderRadius: 10,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  transition: "all 0.22s ease",
                  boxShadow: "0 4px 16px rgba(193,18,31,0.25)",
                }}
              >
                <span style={{ fontSize: 10 }}>▶</span>
                {episodesWatched > 0 && episodesWatched < totalEpisodes
                  ? `Continue Ep ${resumeEp}`
                  : "Watch Now"}
              </button>
              <button
                className="kd-btn-ghost"
                onClick={() => setShowEdit(true)}
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  color: "#f0efeb",
                  fontFamily: "'Inter',sans-serif",
                  fontWeight: 500,
                  fontSize: 13,
                  padding: "12px 28px",
                  borderRadius: 10,
                  cursor: "pointer",
                  transition: "all 0.22s ease",
                  backdropFilter: "blur(6px)",
                }}
              >
                Edit Progress
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
