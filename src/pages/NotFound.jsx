import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { gsap } from "gsap";

export default function NotFound() {
  const cardRef = useRef(null);

  useEffect(() => {
    gsap.fromTo(
      cardRef.current,
      { scale: 0.92, opacity: 0, y: 30 },
      { scale: 1, opacity: 1, y: 0, duration: 0.8, ease: "back.out(1.4)" },
    );
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg,#0a0303 0%,#160000 50%,#0a0303 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "80px 24px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(230,57,70,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(230,57,70,0.04) 1px,transparent 1px)",
          backgroundSize: "40px 40px",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          fontSize: "35vw",
          fontFamily: "'Noto Serif JP',serif",
          color: "rgba(230,57,70,0.025)",
          pointerEvents: "none",
          userSelect: "none",
          lineHeight: 1,
        }}
      >
        無
      </div>

      <div
        ref={cardRef}
        style={{
          background: "rgba(255,255,255,0.03)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(230,57,70,0.2)",
          borderRadius: 20,
          padding: "52px 48px",
          textAlign: "center",
          maxWidth: 400,
          width: "100%",
          position: "relative",
          zIndex: 1,
          boxShadow: "0 24px 80px rgba(0,0,0,0.6)",
        }}
      >
        <div
          style={{
            fontSize: 72,
            fontFamily: "'Noto Serif JP',serif",
            fontWeight: 700,
            background: "linear-gradient(90deg,#f0efeb,#e63946,#ffd166)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            marginBottom: 8,
          }}
        >
          404
        </div>
        <h2
          style={{
            fontFamily: "'Noto Serif JP',serif",
            fontSize: 22,
            color: "#f0efeb",
            margin: "0 0 14px",
          }}
        >
          Path Severed
        </h2>
        <p
          style={{
            fontFamily: "'Inter',sans-serif",
            fontSize: 13,
            color: "rgba(240,239,235,0.5)",
            lineHeight: 1.7,
            margin: "0 0 32px",
          }}
        >
          The scroll you seek does not exist, or the link has been slashed.
        </p>
        <Link
          to="/"
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "13px 28px",
            borderRadius: 10,
            textDecoration: "none",
            background: "linear-gradient(135deg,#c1121f,#e63946)",
            color: "white",
            fontSize: 13,
            fontFamily: "'Noto Serif JP',serif",
            fontWeight: 700,
            letterSpacing: "0.14em",
            boxShadow: "0 0 28px rgba(193,18,31,0.5)",
          }}
        >
          ← RETURN TO BASE
        </Link>
      </div>

      <style>{`@import url('https://fonts.googleapis.com/css2?family=Noto+Serif+JP:wght@400;700;900&family=Inter:wght@400;500;600&display=swap');`}</style>
    </div>
  );
}
