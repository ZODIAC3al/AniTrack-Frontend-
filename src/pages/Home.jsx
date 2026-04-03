import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { gsap } from "gsap";
import AnimeCard from "../components/AnimeCard.jsx";
import { useAnime } from "../context/AnimeConextProvider.jsx";

const ANIWATCH = "https://aniwatch-api-v1-0.onrender.com";

function HeroSlide({ anime, onLearnMore }) {
  const contentRef = useRef(null);
  const bgRef = useRef(null);

  useEffect(() => {
    if (!anime) return;
    gsap.fromTo(
      contentRef.current,
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.9, ease: "power3.out", delay: 0.1 },
    );
    gsap.fromTo(
      bgRef.current,
      { scale: 1.08 },
      { scale: 1, duration: 6, ease: "power1.out" },
    );
  }, [anime?.animeId]);

  if (!anime) return null;

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "76vh",
        minHeight: 520,
        overflow: "hidden",
      }}
    >
      <div
        ref={bgRef}
        style={{
          position: "absolute",
          inset: "-5%",
          backgroundImage: `url(${anime.imageAnime})`,
          backgroundSize: "cover",
          backgroundPosition: "center 20%",
          filter: "brightness(0.35) saturate(1.3)",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(to right,rgba(8,3,3,0.97) 0%,rgba(8,3,3,0.55) 55%,rgba(8,3,3,0.1) 100%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "50%",
          background: "linear-gradient(to top,#0a0404 0%,transparent 100%)",
        }}
      />

      <div
        ref={contentRef}
        style={{
          position: "absolute",
          bottom: "15%",
          left: 64,
          maxWidth: 520,
          opacity: 0,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 16,
          }}
        >
          <div
            style={{
              padding: "3px 10px",
              background: "rgba(230,57,70,0.15)",
              border: "1px solid rgba(230,57,70,0.4)",
              borderRadius: 20,
              fontSize: 9,
              fontFamily: "'Inter',sans-serif",
              fontWeight: 700,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "#e63946",
            }}
          >
            {anime.spotlight}
          </div>
          <div
            style={{
              padding: "3px 10px",
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 20,
              fontSize: 9,
              fontFamily: "'Inter',sans-serif",
              color: "rgba(240,239,235,0.6)",
              letterSpacing: "0.1em",
            }}
          >
            {anime.format} · {anime.quality} · {anime.duration}
          </div>
        </div>
        <h1
          style={{
            fontFamily: "'Noto Serif JP',serif",
            fontSize: 52,
            fontWeight: 900,
            color: "#f0efeb",
            margin: "0 0 14px",
            lineHeight: 1.06,
            textShadow: "0 2px 32px rgba(0,0,0,0.7)",
          }}
        >
          {anime.name}
        </h1>
        {anime.jname && (
          <p
            style={{
              fontFamily: "'Inter',sans-serif",
              fontSize: 13,
              color: "rgba(240,239,235,0.45)",
              margin: "0 0 12px",
              letterSpacing: "0.06em",
            }}
          >
            {anime.jname}
          </p>
        )}
        {anime.anidesc && (
          <p
            style={{
              fontFamily: "'Inter',sans-serif",
              fontSize: 13,
              color: "rgba(240,239,235,0.65)",
              lineHeight: 1.75,
              margin: "0 0 28px",
              display: "-webkit-box",
              WebkitLineClamp: 3,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {anime.anidesc}
          </p>
        )}

        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <button
            onClick={() => onLearnMore(anime.animeId)}
            className="hero-btn-primary"
            style={{
              background: "#e63946",
              border: "none",
              color: "#fff",
              fontFamily: "'Inter',sans-serif",
              fontWeight: 600,
              fontSize: 13,
              padding: "11px 26px",
              borderRadius: 9,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
              boxShadow: "0 4px 20px rgba(230,57,70,0.4)",
              transition: "all 0.22s",
            }}
          >
            <span style={{ fontSize: 10 }}>▶</span> Watch Now
          </button>
          <button
            className="hero-btn-secondary"
            style={{
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.2)",
              color: "#f0efeb",
              fontFamily: "'Inter',sans-serif",
              fontSize: 13,
              padding: "11px 24px",
              borderRadius: 9,
              cursor: "pointer",
              backdropFilter: "blur(8px)",
              transition: "all 0.22s",
            }}
          >
            + Add to List
          </button>
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ children, action, onAction }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 24,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div
          style={{
            width: 3,
            height: 20,
            background: "linear-gradient(to bottom,#e63946,#ffd166)",
            borderRadius: 2,
          }}
        />
        <h2
          style={{
            margin: 0,
            fontFamily: "'Noto Serif JP',serif",
            fontSize: 19,
            fontWeight: 700,
            color: "#f0efeb",
          }}
        >
          {children}
        </h2>
      </div>
      {action && (
        <span
          onClick={onAction}
          style={{
            fontSize: 12,
            color: "#e63946",
            cursor: "pointer",
            fontFamily: "'Inter',sans-serif",
            borderBottom: "1px solid rgba(230,57,70,0.3)",
            letterSpacing: "0.05em",
          }}
          className="view-all"
        >
          {action} →
        </span>
      )}
    </div>
  );
}

export default function Home() {
  const [homeData, setHomeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Destructure animes from context
  const { animes } = useAnime();

  // === DEBUG LOG 1: Render Level ===
  console.log("🔴 [Home Render] Current 'animes' from context:", animes);
  // =================================

  // === DEBUG LOG 2: Watch for changes to 'animes' specifically ===
  useEffect(() => {
    console.log("🟢 [useEffect] 'animes' data changed/updated!");
    console.log("🟢 [useEffect] Is it an array?:", Array.isArray(animes));
    console.log("🟢 [useEffect] Length:", animes?.length);
    console.log("🟢 [useEffect] Full animes payload:", animes);
  }, [animes]);
  // ===============================================================

  useEffect(() => {
    console.log("🟡 [API Fetch] Starting request to ANIWATCH...");
    fetch(`${ANIWATCH}/api/parse`)
      .then((r) => r.json())
      .then((d) => {
        console.log("🟡 [API Fetch] Success! Received data:", d);
        setHomeData(d);
        setLoading(false);
      })
      .catch((err) => {
        console.error("🔴 [API Fetch] Failed:", err);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    // === DEBUG LOG 3: Track GSAP Animation conditions ===
    console.log("🟣 [GSAP useEffect] Checking conditions to animate...");
    console.log("🟣 [GSAP useEffect] homeData exists?:", !!homeData);
    console.log("🟣 [GSAP useEffect] animes.length:", animes?.length);

    if (!homeData && animes?.length === 0) {
      console.log(
        "🟣 [GSAP useEffect] Bail out: No homeData AND animes is empty.",
      );
      return;
    }

    console.log("🟣 [GSAP useEffect] Running GSAP animation sequence.");
    // =====================================================

    gsap.fromTo(
      ".home-section",
      { y: 30, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.7,
        stagger: 0.12,
        ease: "power3.out",
        delay: 0.2,
      },
    );
  }, [homeData, animes]);

  const featured = homeData?.slides?.[0] ?? null;
  const trending = homeData?.trend ?? [];
  const upcoming = homeData?.UpcomingAnime ?? [];

  return (
    <div
      style={{ minHeight: "100vh", background: "#0a0404", color: "#f0efeb" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+JP:wght@400;700;900&family=Inter:wght@400;500;600;700&display=swap');
        .hero-btn-primary:hover { background: #c1121f !important; transform: translateY(-1px); }
        .hero-btn-secondary:hover { background: rgba(255,255,255,0.14) !important; }
        .view-all:hover { color: #ffd166 !important; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* Hero */}
      {loading ? (
        <div
          style={{
            height: "76vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              border: "3px solid rgba(230,57,70,0.15)",
              borderTopColor: "#e63946",
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
            }}
          />
        </div>
      ) : (
        <HeroSlide
          anime={featured}
          onLearnMore={(id) => navigate(`/animes/${id}`)}
        />
      )}

      <div style={{ padding: "52px 60px 80px" }}>
        {/* Your Library */}
        {animes?.length > 0 && (
          <section className="home-section" style={{ marginBottom: 56 }}>
            <SectionTitle
              action="View All"
              onAction={() => navigate("/top-animes")}
            >
              Your Library
            </SectionTitle>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))",
                gap: 18,
              }}
            >
              {animes.slice(0, 6).map((a, i) => (
                <AnimeCard key={a._id} anime={a} index={i} />
              ))}
            </div>
          </section>
        )}

        {/* Trending */}
        {trending.length > 0 && (
          <section className="home-section" style={{ marginBottom: 56 }}>
            <SectionTitle>Trending Now</SectionTitle>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill,minmax(170px,1fr))",
                gap: 18,
              }}
            >
              {trending.slice(0, 8).map((a, i) => (
                <AnimeCard
                  key={a.iD || i}
                  index={i}
                  anime={{
                    id: a.iD,
                    title: a.name,
                    coverImageUrl: a.imgAni,
                    rating: a.ranking,
                    status: "Trending",
                  }}
                />
              ))}
            </div>
          </section>
        )}

        {/* Upcoming */}
        {upcoming.length > 0 && (
          <section className="home-section">
            <SectionTitle>Upcoming Releases</SectionTitle>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill,minmax(170px,1fr))",
                gap: 18,
              }}
            >
              {upcoming.slice(0, 8).map((a, i) => (
                <AnimeCard
                  key={a.idani || i}
                  index={i}
                  anime={{
                    id: a.idani,
                    title: a.name,
                    coverImageUrl: a.imgAnime,
                    status: a.format,
                    releaseYear: a.release,
                  }}
                />
              ))}
            </div>
          </section>
        )}

        {/* Empty state */}
        {!loading && animes?.length === 0 && trending.length === 0 && (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <div style={{ fontSize: 64, marginBottom: 20, opacity: 0.3 }}>
              📚
            </div>
            <h2
              style={{
                fontFamily: "'Noto Serif JP',serif",
                color: "#f0efeb",
                marginBottom: 12,
              }}
            >
              Your archive is empty
            </h2>
            <p
              style={{
                color: "rgba(240,239,235,0.4)",
                fontFamily: "'Inter',sans-serif",
                marginBottom: 24,
              }}
            >
              Start building your collection
            </p>
            <button
              onClick={() => navigate("/add-anime")}
              style={{
                background: "#e63946",
                border: "none",
                color: "#fff",
                padding: "11px 28px",
                borderRadius: 10,
                cursor: "pointer",
                fontFamily: "'Inter',sans-serif",
                fontWeight: 600,
                fontSize: 13,
              }}
            >
              + Add Your First Anime
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
