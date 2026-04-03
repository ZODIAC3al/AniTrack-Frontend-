import { useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { gsap } from "gsap";
import { useAnime } from "../context/AnimeConextProvider.jsx";

const STATUS_COLORS = {
  Completed: {
    bg: "rgba(16,185,129,0.15)",
    border: "rgba(16,185,129,0.4)",
    text: "#34d399",
  },
  Watching: {
    bg: "rgba(59,130,246,0.15)",
    border: "rgba(59,130,246,0.4)",
    text: "#60a5fa",
  },
  "Plan to Watch": {
    bg: "rgba(168,85,247,0.15)",
    border: "rgba(168,85,247,0.4)",
    text: "#c084fc",
  },
  Dropped: {
    bg: "rgba(239,68,68,0.15)",
    border: "rgba(239,68,68,0.4)",
    text: "#f87171",
  },
  "On Hold": {
    bg: "rgba(234,179,8,0.15)",
    border: "rgba(234,179,8,0.4)",
    text: "#fbbf24",
  },
  default: {
    bg: "rgba(230,57,70,0.15)",
    border: "rgba(230,57,70,0.4)",
    text: "#e63946",
  },
};

export default function AnimeCard({ anime, index = 0 }) {
  const cardRef = useRef(null);
  const imgRef = useRef(null);
  const overlayRef = useRef(null);
  const navigate = useNavigate();
  const { toggleFavorite, isFavorite } = useAnime();
  const isFav = isFavorite(anime.id);

  const id = anime._id ?? anime.id ?? anime.animeId ?? anime.iD;
  const title = anime.title ?? anime.name ?? "Unknown";
  const cover =
    anime.coverImageUrl ??
    anime.coverImage ??
    anime.imageAnime ??
    anime.imgAni ??
    anime.image;
  const rating = anime.rating ?? anime.malscore ?? null;
  const status = anime.status ?? anime.format ?? "TV";
  const romajiTitle = anime.romajiTitle ?? anime.jname ?? "";
  const year = anime.releaseYear ?? anime.release ?? "";
  const studio = anime.studio ?? "";
  const watched = anime.episodesWatched ?? 0;
  const total = anime.totalEpisodes ?? 0;
  const pct = total > 0 ? Math.min(100, (watched / total) * 100) : 0;
  const statusStyle = STATUS_COLORS[status] ?? STATUS_COLORS.default;
  const fav = isFavorite(id);

  useEffect(() => {
    if (!cardRef.current) return;
    gsap.fromTo(
      cardRef.current,
      { y: 40, opacity: 0, scale: 0.93 },
      {
        y: 0,
        opacity: 1,
        scale: 1,
        duration: 0.65,
        delay: Math.min(index * 0.06, 0.5),
        ease: "power3.out",
        clearProps: "transform",
      },
    );
  }, [index]);

  const handleMouseEnter = () => {
    gsap.to(cardRef.current, {
      y: -8,
      scale: 1.03,
      duration: 0.3,
      ease: "power2.out",
    });
    gsap.to(imgRef.current, { scale: 1.08, duration: 0.5, ease: "power2.out" });
    gsap.to(overlayRef.current, { opacity: 1, duration: 0.25 });
  };

  const handleMouseLeave = () => {
    gsap.to(cardRef.current, {
      y: 0,
      scale: 1,
      duration: 0.35,
      ease: "power2.out",
    });
    gsap.to(imgRef.current, { scale: 1, duration: 0.4, ease: "power2.out" });
    gsap.to(overlayRef.current, { opacity: 0, duration: 0.25 });
  };

  const handleFavClick = (e) => {
    e.stopPropagation();
    if (!id) return;
    toggleFavorite(anime);
    gsap.fromTo(
      e.currentTarget,
      { scale: 1.6 },
      { scale: 1, duration: 0.4, ease: "back.out(3)" },
    );
  };

  return (
    <div
      ref={cardRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={() => id && navigate(`/animes/${id}`)}
      style={{
        background: "rgba(255,255,255,0.025)",
        border: "1px solid rgba(230,57,70,0.14)",
        borderRadius: 16,
        overflow: "hidden",
        cursor: "pointer",
        position: "relative",
        display: "flex",
        flexDirection: "column",
        boxShadow: "0 4px 24px rgba(0,0,0,0.35)",
        transition: "border-color 0.3s, box-shadow 0.3s",
        opacity: 0,
      }}
    >
      {/* Image */}
      <div
        style={{ position: "relative", aspectRatio: "2/3", overflow: "hidden" }}
      >
        <img
          ref={imgRef}
          src={
            cover || "https://placehold.co/300x450/1a0a0a/e63946?text=No+Image"
          }
          alt={title}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
            transformOrigin: "center",
          }}
          onError={(e) => {
            e.target.src =
              "https://placehold.co/300x450/1a0a0a/e63946?text=No+Image";
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to top, rgba(8,3,3,1) 0%, rgba(8,3,3,0.3) 45%, transparent 100%)",
          }}
        />

        {/* Hover overlay */}
        <div
          ref={overlayRef}
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(230,57,70,0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: 0,
          }}
        >
          <div
            style={{
              width: 50,
              height: 50,
              borderRadius: "50%",
              background: "rgba(230,57,70,0.85)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 0 24px rgba(230,57,70,0.6)",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 18 18" fill="white">
              <path d="M4 3L14 9L4 15V3Z" />
            </svg>
          </div>
        </div>

        {/* Status badge */}
        <div
          style={{
            position: "absolute",
            top: 10,
            left: 10,
            background: statusStyle.bg,
            border: `1px solid ${statusStyle.border}`,
            color: statusStyle.text,
            fontSize: 9,
            fontFamily: "'Inter',sans-serif",
            fontWeight: 700,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            padding: "3px 9px",
            borderRadius: 20,
            backdropFilter: "blur(6px)",
          }}
        >
          {status}
        </div>

        {/* Rating */}
        {rating && (
          <div
            style={{
              position: "absolute",
              top: 10,
              right: 10,
              background: "rgba(8,3,3,0.75)",
              border: "1px solid rgba(255,209,102,0.3)",
              borderRadius: 7,
              padding: "3px 7px",
              display: "flex",
              alignItems: "center",
              gap: 3,
              backdropFilter: "blur(4px)",
            }}
          >
            <span style={{ color: "#ffd166", fontSize: 10 }}>★</span>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "#f0efeb",
                fontFamily: "'Inter',sans-serif",
              }}
            >
              {rating}
            </span>
          </div>
        )}

        {/* Fav button */}
        <button
          onClick={handleFavClick}
          style={{
            position: "absolute",
            bottom: 50,
            right: 10,
            background: fav ? "rgba(230,57,70,0.85)" : "rgba(8,3,3,0.6)",
            border: `1px solid ${fav ? "rgba(230,57,70,0.6)" : "rgba(255,255,255,0.15)"}`,
            borderRadius: "50%",
            width: 30,
            height: 30,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            backdropFilter: "blur(4px)",
            transition: "background 0.2s, border-color 0.2s",
          }}
        >
          <svg
            width="13"
            height="13"
            viewBox="0 0 16 16"
            fill={fav ? "white" : "none"}
            stroke="white"
            strokeWidth="1.5"
          >
            <path d="M8 14s-6-3.9-6-8a4 4 0 0 1 6-3.4A4 4 0 0 1 14 6c0 4.1-6 8-6 8z" />
          </svg>
        </button>
      </div>

      {/* Info */}
      <div
        style={{
          padding: "13px 15px 16px",
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: 5,
        }}
      >
        <h3
          style={{
            margin: 0,
            fontSize: 14,
            fontWeight: 700,
            color: "#f0efeb",
            fontFamily: "'Noto Serif JP',serif",
            lineHeight: 1.3,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {title}
        </h3>
        {romajiTitle && (
          <p
            style={{
              margin: 0,
              fontSize: 10,
              color: "rgba(240,239,235,0.4)",
              fontFamily: "'Inter',sans-serif",
              overflow: "hidden",
              whiteSpace: "nowrap",
              textOverflow: "ellipsis",
            }}
          >
            {romajiTitle}
            {year ? ` · ${year}` : ""}
          </p>
        )}
        {studio && (
          <p
            style={{
              margin: 0,
              fontSize: 10,
              color: "rgba(230,57,70,0.8)",
              fontFamily: "'Inter',sans-serif",
            }}
          >
            {studio}
          </p>
        )}

        {/* Progress */}
        {total > 0 && (
          <div style={{ marginTop: "auto", paddingTop: 8 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 4,
              }}
            >
              <span
                style={{
                  fontSize: 9,
                  color: "rgba(240,239,235,0.35)",
                  fontFamily: "'Inter',sans-serif",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                }}
              >
                Progress
              </span>
              <span
                style={{
                  fontSize: 10,
                  color: "#ffd166",
                  fontFamily: "'Inter',sans-serif",
                  fontWeight: 600,
                }}
              >
                {watched}/{total}
              </span>
            </div>
            <div
              style={{
                height: 3,
                background: "rgba(255,255,255,0.07)",
                borderRadius: 2,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${pct}%`,
                  background: "linear-gradient(90deg,#e63946,#ffd166)",
                  borderRadius: 2,
                  transition: "width 0.6s ease",
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
