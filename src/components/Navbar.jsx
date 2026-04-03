import { useState, useRef, useEffect } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { gsap } from "gsap";
import { useAnime } from "../context/AnimeConextProvider.jsx";

const navLinks = [
  { path: "/", label: "Home", exact: true },
  { path: "/top-animes", label: "Library" },
  { path: "/favorites", label: "Favorites" },
  { path: "/dashboard", label: "Dashboard" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);

  const navRef = useRef(null);
  const logoRef = useRef(null);
  const linksRef = useRef([]);
  const mobileMenuRef = useRef(null);
  const searchRef = useRef(null);

  const location = useLocation();
  const navigate = useNavigate();
  const { animes, favorites } = useAnime();

  useEffect(() => {
    setMobileOpen(false);
    setSearchOpen(false);
    setSearchQuery("");
  }, [location.pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const tl = gsap.timeline();
    tl.fromTo(
      navRef.current,
      { y: -80, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, ease: "back.out(1.4)" },
    )
      .fromTo(
        logoRef.current,
        { scale: 0.6, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.6, ease: "back.out(2)" },
        "-=0.4",
      )
      .fromTo(
        linksRef.current.filter(Boolean),
        { y: -20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, stagger: 0.08, ease: "power2.out" },
        "-=0.3",
      );
  }, []);

  useEffect(() => {
    if (!mobileMenuRef.current) return;
    if (mobileOpen) {
      gsap.fromTo(
        mobileMenuRef.current,
        { height: 0, opacity: 0 },
        { height: "auto", opacity: 1, duration: 0.35, ease: "power2.out" },
      );
    } else {
      gsap.to(mobileMenuRef.current, {
        height: 0,
        opacity: 0,
        duration: 0.25,
        ease: "power2.in",
      });
    }
  }, [mobileOpen]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const q = searchQuery.toLowerCase();
    setSearchResults(
      animes
        .filter(
          (a) =>
            a.title?.toLowerCase().includes(q) ||
            a.romajiTitle?.toLowerCase().includes(q),
        )
        .slice(0, 5),
    );
  }, [searchQuery, animes]);

  useEffect(() => {
    if (searchOpen && searchRef.current)
      setTimeout(() => searchRef.current?.focus(), 80);
  }, [searchOpen]);

  return (
    <>
      <nav
        ref={navRef}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 200,
          padding: "0 28px",
          height: "62px",
          display: "flex",
          alignItems: "center",
          background: scrolled ? "rgba(8,3,3,0.92)" : "rgba(8,3,3,0.6)",
          backdropFilter: "blur(20px)",
          borderBottom: scrolled
            ? "1px solid rgba(230,57,70,0.18)"
            : "1px solid rgba(255,255,255,0.04)",
          transition: "background 0.4s, border-color 0.4s, box-shadow 0.4s",
          boxShadow: scrolled ? "0 4px 32px rgba(0,0,0,0.5)" : "none",
        }}
      >
        <div
          style={{
            maxWidth: 1280,
            margin: "0 auto",
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {/* Logo */}
          <NavLink
            to="/"
            style={{
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <svg
              ref={logoRef}
              viewBox="0 0 40 40"
              style={{
                width: 32,
                height: 32,
                filter: "drop-shadow(0 0 8px rgba(230,57,70,0.7))",
              }}
            >
              <defs>
                <linearGradient id="nlg" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#ffd166" />
                  <stop offset="100%" stopColor="#e63946" />
                </linearGradient>
              </defs>
              <path
                d="M20 2 L23 17 L38 20 L23 23 L20 38 L17 23 L2 20 L17 17 Z"
                fill="none"
                stroke="url(#nlg)"
                strokeWidth="2.2"
                strokeLinejoin="round"
              />
              <circle cx="20" cy="20" r="9" fill="rgba(230,57,70,0.14)" />
              <text
                x="50%"
                y="54%"
                textAnchor="middle"
                dominantBaseline="middle"
                fill="#f0efeb"
                fontSize="13"
                fontFamily="'Noto Serif JP',serif"
                fontWeight="700"
              >
                魂
              </text>
            </svg>
            <div>
              <div
                style={{
                  fontSize: 14,
                  fontFamily: "'Noto Serif JP',serif",
                  fontWeight: 700,
                  background: "linear-gradient(90deg,#f0efeb,#ffd166)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  letterSpacing: "0.12em",
                  lineHeight: 1.1,
                }}
              >
                AniTrack
              </div>
              <div
                style={{
                  fontSize: 7.5,
                  color: "#e63946",
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  fontFamily: "'Inter',sans-serif",
                }}
              >
                Forge Your Legacy
              </div>
            </div>
          </NavLink>

          {/* Desktop nav links */}
          <div
            className="desktop-nav"
            style={{ display: "flex", gap: 28, alignItems: "center" }}
          >
            {navLinks.map((link, i) => (
              <NavLink
                key={link.path}
                ref={(el) => (linksRef.current[i] = el)}
                to={link.path}
                end={link.exact}
                className={({ isActive }) =>
                  `nb-link${isActive ? " active" : ""}`
                }
              >
                {link.label}
                {link.path === "/favorites" && favorites.length > 0 && (
                  <span
                    style={{
                      marginLeft: 5,
                      background: "#e63946",
                      color: "#fff",
                      fontSize: 9,
                      fontWeight: 700,
                      padding: "1px 5px",
                      borderRadius: 8,
                    }}
                  >
                    {favorites.length}
                  </span>
                )}
              </NavLink>
            ))}
          </div>

          {/* Right actions */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/* Search */}
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setSearchOpen((s) => !s)}
                className="nb-icon-btn"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 8,
                  width: 34,
                  height: 34,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: "#f0efeb",
                  transition: "all 0.2s",
                }}
              >
                <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                  <circle
                    cx="6.5"
                    cy="6.5"
                    r="4.5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M10 10L14 14"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
              {searchOpen && (
                <div
                  style={{
                    position: "absolute",
                    top: "calc(100% + 8px)",
                    right: 0,
                    width: 290,
                    background: "rgba(10,3,3,0.97)",
                    border: "1px solid rgba(230,57,70,0.25)",
                    borderRadius: 12,
                    overflow: "hidden",
                    boxShadow: "0 20px 60px rgba(0,0,0,0.7)",
                    zIndex: 300,
                  }}
                >
                  <div
                    style={{
                      padding: "10px 14px",
                      borderBottom: "1px solid rgba(255,255,255,0.06)",
                    }}
                  >
                    <input
                      ref={searchRef}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search your library…"
                      style={{
                        width: "100%",
                        background: "transparent",
                        border: "none",
                        outline: "none",
                        color: "#f0efeb",
                        fontSize: 13,
                        fontFamily: "'Inter',sans-serif",
                      }}
                    />
                  </div>
                  {searchResults.length > 0 && (
                    <div>
                      {searchResults.map((a) => (
                        <div
                          key={a._id}
                          onClick={() => {
                            navigate(`/animes/${a._id}`);
                            setSearchOpen(false);
                            setSearchQuery("");
                          }}
                          className="nb-search-result"
                          style={{
                            padding: "10px 14px",
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            cursor: "pointer",
                          }}
                        >
                          {a.coverImageUrl && (
                            <img
                              src={a.coverImageUrl}
                              alt=""
                              style={{
                                width: 26,
                                height: 36,
                                objectFit: "cover",
                                borderRadius: 4,
                              }}
                              onError={(e) => (e.target.style.display = "none")}
                            />
                          )}
                          <div>
                            <div
                              style={{
                                fontSize: 12,
                                color: "#f0efeb",
                                fontFamily: "'Inter',sans-serif",
                              }}
                            >
                              {a.title}
                            </div>
                            <div
                              style={{
                                fontSize: 10,
                                color: "rgba(240,239,235,0.4)",
                                fontFamily: "'Inter',sans-serif",
                              }}
                            >
                              {a.status} · {a.releaseYear}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {searchQuery && searchResults.length === 0 && (
                    <div
                      style={{
                        padding: "14px",
                        textAlign: "center",
                        color: "rgba(240,239,235,0.3)",
                        fontSize: 12,
                        fontFamily: "'Inter',sans-serif",
                      }}
                    >
                      No results in your library
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Add anime button */}
            <button
              onClick={() => navigate("/add-anime")}
              className="nb-add-btn"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                background: "rgba(230,57,70,0.12)",
                border: "1px solid rgba(230,57,70,0.35)",
                borderRadius: 8,
                color: "#e63946",
                fontSize: 12,
                fontWeight: 600,
                padding: "7px 14px",
                cursor: "pointer",
                fontFamily: "'Inter',sans-serif",
                transition: "all 0.2s",
              }}
            >
              <span style={{ fontSize: 14, lineHeight: 1 }}>+</span> Add Anime
            </button>

            {/* Mobile hamburger */}
            <button
              className="mobile-toggle"
              onClick={() => setMobileOpen((o) => !o)}
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                padding: 6,
                display: "flex",
                flexDirection: "column",
                gap: 4,
              }}
            >
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  style={{
                    display: "block",
                    width: 22,
                    height: 2,
                    borderRadius: 2,
                    background: mobileOpen ? "#e63946" : "#ffd166",
                    transition: "all 0.3s",
                    transform: mobileOpen
                      ? i === 0
                        ? "rotate(45deg) translate(4px,4px)"
                        : i === 2
                          ? "rotate(-45deg) translate(4px,-4px)"
                          : "scaleX(0)"
                      : "none",
                  }}
                />
              ))}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <div
          ref={mobileMenuRef}
          className="mobile-menu"
          style={{
            position: "absolute",
            top: "62px",
            left: 0,
            right: 0,
            overflow: "hidden",
            height: 0,
            opacity: 0,
            background: "rgba(8,3,3,0.97)",
            backdropFilter: "blur(20px)",
            borderBottom: "1px solid rgba(230,57,70,0.12)",
          }}
        >
          <div style={{ padding: "8px 0 16px" }}>
            {navLinks.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                end={link.exact}
                className={({ isActive }) =>
                  `nb-mobile-link${isActive ? " active" : ""}`
                }
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "13px 24px",
                  textDecoration: "none",
                  color: "rgba(240,239,235,0.65)",
                  fontFamily: "'Inter',sans-serif",
                  fontSize: 14,
                  letterSpacing: "0.06em",
                  transition: "color 0.2s",
                }}
              >
                <span style={{ color: "#e63946", fontSize: 8 }}>◆</span>{" "}
                {link.label}
              </NavLink>
            ))}
            <div style={{ padding: "8px 24px 0" }}>
              <button
                onClick={() => {
                  navigate("/add-anime");
                  setMobileOpen(false);
                }}
                style={{
                  width: "100%",
                  padding: "11px",
                  background: "rgba(230,57,70,0.12)",
                  border: "1px solid rgba(230,57,70,0.3)",
                  borderRadius: 10,
                  color: "#e63946",
                  fontFamily: "'Inter',sans-serif",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                + Add Anime
              </button>
            </div>
          </div>
        </div>
      </nav>

      <style>{`
        .nb-link { position: relative; text-decoration: none; font-family: 'Inter',sans-serif; font-size: 12px; font-weight: 500; color: rgba(240,239,235,0.55); letter-spacing: 0.07em; text-transform: uppercase; padding: 8px 0; transition: color 0.25s; }
        .nb-link:hover { color: #f0efeb; }
        .nb-link.active { color: #ffd166; text-shadow: 0 0 12px rgba(255,209,102,0.4); }
        .nb-link::after { content: ''; position: absolute; bottom: 0; left: 50%; transform: translateX(-50%); width: 0; height: 2px; background: linear-gradient(90deg,#e63946,#ffd166); transition: width 0.3s cubic-bezier(0.16,1,0.3,1); border-radius: 2px; }
        .nb-link:hover::after, .nb-link.active::after { width: 100%; }
        .nb-icon-btn:hover { background: rgba(255,255,255,0.1) !important; }
        .nb-add-btn:hover { background: rgba(230,57,70,0.22) !important; border-color: rgba(230,57,70,0.6) !important; }
        .nb-search-result:hover { background: rgba(230,57,70,0.06); }
        .nb-mobile-link:hover, .nb-mobile-link.active { color: #ffd166 !important; }
        @media (min-width: 769px) { .mobile-toggle { display: none !important; } }
        @media (max-width: 768px) { .desktop-nav { display: none !important; } .nb-add-btn { display: none !important; } }
      `}</style>
    </>
  );
}
