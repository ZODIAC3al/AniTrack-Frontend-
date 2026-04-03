import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { gsap } from "gsap";
// FIX: Ensure this matches your file name (AnimeConextProvider vs AnimeContextProvider)
import { useAnime } from "../context/AnimeConextProvider.jsx";

const EMPTY = {
  title: "",
  romajiTitle: "",
  status: "Plan to Watch",
  episodesWatched: 0,
  totalEpisodes: 0,
  rating: 0,
  releaseYear: new Date().getFullYear(),
  studio: "",
  historicalSetting: "",
  coverImageUrl: "",
  notes: "",
};

const STATUSES = [
  "Watching",
  "Completed",
  "On Hold",
  "Dropped",
  "Plan to Watch",
];

// --- UI Components ---
function Field({ label, accent = "#e63946", children }) {
  return (
    <div className="aform-field">
      <div
        style={{
          fontSize: 9,
          fontFamily: "'Inter',sans-serif",
          fontWeight: 700,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: accent,
          marginBottom: 6,
        }}
      >
        {label}
      </div>
      {children}
    </div>
  );
}

const inputStyle = (focused) => ({
  width: "100%",
  background: focused ? "rgba(230,57,70,0.06)" : "rgba(255,255,255,0.04)",
  border: `1px solid ${focused ? "rgba(230,57,70,0.65)" : "rgba(255,255,255,0.1)"}`,
  borderRadius: 8,
  padding: "10px 13px",
  color: "#f0efeb",
  fontSize: 13,
  fontFamily: "'Inter',sans-serif",
  outline: "none",
  boxSizing: "border-box",
  transition: "all 0.2s",
  boxShadow: focused ? "0 0 0 3px rgba(230,57,70,0.12)" : "none",
});

function Input({
  label,
  type = "text",
  value,
  onChange,
  name,
  min,
  max,
  accent,
}) {
  const [focused, setFocused] = useState(false);
  return (
    <Field label={label} accent={accent}>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        min={min}
        max={max}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={inputStyle(focused)}
      />
    </Field>
  );
}

function Select({ label, value, onChange, name, options, accent }) {
  const [focused, setFocused] = useState(false);
  return (
    <Field label={label} accent={accent}>
      <select
        name={name}
        value={value}
        onChange={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          ...inputStyle(focused),
          appearance: "none",
          cursor: "pointer",
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 10 10'%3E%3Cpath fill='%23ffd166' d='M5 7L0 2h10z'/%3E%3C/svg%3E")`,
          backgroundRepeat: "no-repeat",
          backgroundPosition: "right 12px center",
          paddingRight: 32,
        }}
      >
        {options.map((o) => (
          <option key={o} value={o} style={{ background: "#0d0505" }}>
            {o}
          </option>
        ))}
      </select>
    </Field>
  );
}

function Textarea({ label, value, onChange, name, rows = 3, accent }) {
  const [focused, setFocused] = useState(false);
  return (
    <Field label={label} accent={accent}>
      <textarea
        name={name}
        value={value}
        onChange={onChange}
        rows={rows}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{ ...inputStyle(focused), resize: "vertical", lineHeight: 1.65 }}
      />
    </Field>
  );
}

function StarRating({ value, onChange }) {
  const [hovered, setHovered] = useState(null);
  return (
    <Field label="Your Rating" accent="#ffd166">
      <div
        style={{ display: "flex", alignItems: "center", gap: 4, paddingTop: 2 }}
      >
        {Array.from({ length: 10 }, (_, i) => i + 1).map((star) => (
          <span
            key={star}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(null)}
            onClick={() =>
              onChange({ target: { name: "rating", value: star } })
            }
            style={{
              fontSize: 18,
              cursor: "pointer",
              transition: "color 0.12s, transform 0.12s",
              color:
                star <= (hovered ?? value)
                  ? "#ffd166"
                  : "rgba(255,255,255,0.1)",
              transform:
                star <= (hovered ?? value) ? "scale(1.25)" : "scale(1)",
              display: "inline-block",
            }}
          >
            ★
          </span>
        ))}
        <span
          style={{
            fontSize: 12,
            color: "#e63946",
            fontWeight: 700,
            marginLeft: 6,
            fontFamily: "'Inter',sans-serif",
          }}
        >
          {hovered ?? value}/10
        </span>
      </div>
    </Field>
  );
}

// --- Main Form Component ---
export default function AnimeForm({ editData = null, onClose = null }) {
  const [form, setForm] = useState(editData ?? EMPTY);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errors, setErrors] = useState({});
  const formRef = useRef(null);
  const navigate = useNavigate();
  const { addAnime, updateAnime } = useAnime();
  const isEditing = !!editData;

  // Sync form state if editData changes (important for modals)
  useEffect(() => {
    if (editData) setForm(editData);
  }, [editData]);

  // Entrance Animations
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        formRef.current,
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.7, ease: "power3.out" },
      );
      gsap.fromTo(
        ".aform-field",
        { y: 20, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.5,
          stagger: 0.04,
          delay: 0.2,
          ease: "power2.out",
        },
      );
    });
    return () => ctx.revert(); // Cleanup GSAP
  }, []);

  const validate = () => {
    const e = {};
    if (!form.title?.trim()) e.title = "Title is required";
    if (form.rating < 0 || form.rating > 10) e.rating = "Rating must be 0–10";
    if (form.episodesWatched < 0) e.episodesWatched = "Cannot be negative";
    if (form.totalEpisodes < 0) e.totalEpisodes = "Cannot be negative";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: [
        "rating",
        "episodesWatched",
        "totalEpisodes",
        "releaseYear",
      ].includes(name)
        ? value === ""
          ? 0
          : Number(value) // Prevent NaN if input is cleared
        : value,
    }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      gsap.fromTo(
        formRef.current,
        { x: -8 },
        { x: 0, duration: 0.4, ease: "elastic.out(1,0.3)" },
      );
      return;
    }
    setSaving(true);
    try {
      if (isEditing) {
        await updateAnime(editData._id, form);
      } else {
        await addAnime(form);
      }
      setSaved(true);
      gsap.fromTo(
        formRef.current,
        { scale: 0.98 },
        { scale: 1, duration: 0.4, ease: "back.out(2)" },
      );

      setTimeout(() => {
        if (onClose) onClose();
        else navigate("/top-animes");
      }, 1200);
    } catch (err) {
      setErrors({ submit: err.message || "Something went wrong" });
      gsap.fromTo(
        formRef.current,
        { x: -10 },
        { x: 0, duration: 0.5, ease: "elastic.out(1,0.3)" },
      );
    } finally {
      setSaving(false);
    }
  };

  const pct =
    form.totalEpisodes > 0
      ? Math.min(100, (form.episodesWatched / form.totalEpisodes) * 100)
      : 0;

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg,#0a0303 0%,#160000 50%,#0a0303 100%)",
        padding: "48px 24px 80px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Decorative Grid */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(230,57,70,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(230,57,70,0.04) 1px,transparent 1px)",
          backgroundSize: "44px 44px",
          pointerEvents: "none",
        }}
      />

      <div
        ref={formRef}
        style={{
          maxWidth: 720,
          margin: "0 auto",
          position: "relative",
          zIndex: 1,
        }}
      >
        <div style={{ marginBottom: 32 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 8,
            }}
          >
            <div
              style={{
                width: 5,
                height: 5,
                borderRadius: "50%",
                background: "#e63946",
                boxShadow: "0 0 8px #e63946",
              }}
            />
            <span
              style={{
                fontSize: 10,
                fontFamily: "'Inter',sans-serif",
                fontWeight: 700,
                letterSpacing: "0.18em",
                color: "#e63946",
                textTransform: "uppercase",
              }}
            >
              {isEditing ? "Edit Entry" : "New Entry"}
            </span>
          </div>
          <h1
            style={{
              margin: 0,
              fontFamily: "'Noto Serif JP',serif",
              fontSize: 32,
              fontWeight: 900,
              background: "linear-gradient(90deg,#f0efeb,#e63946,#ffd166)",
              backgroundSize: "200%",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              animation: "shimmer 3s ease infinite",
            }}
          >
            {isEditing ? `Edit: ${form.title}` : "Add to Archive"}
          </h1>
        </div>

        <form onSubmit={handleSubmit}>
          <div
            style={{
              background: "rgba(255,255,255,0.025)",
              border: "1px solid rgba(230,57,70,0.18)",
              borderRadius: 20,
              padding: "32px 28px",
              backdropFilter: "blur(16px)",
              boxShadow: "0 24px 80px rgba(0,0,0,0.55)",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {/* Cover URL + Preview */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: form.coverImageUrl ? "72px 1fr" : "1fr",
                  gap: 16,
                  alignItems: "end",
                }}
              >
                {form.coverImageUrl && (
                  <img
                    src={form.coverImageUrl}
                    alt=""
                    style={{
                      width: 72,
                      height: 96,
                      objectFit: "cover",
                      borderRadius: 8,
                      border: "1px solid rgba(230,57,70,0.3)",
                    }}
                    onError={(e) => (e.target.style.display = "none")}
                  />
                )}
                <Input
                  label="Cover Image URL"
                  name="coverImageUrl"
                  value={form.coverImageUrl}
                  onChange={handleChange}
                  accent="#a78bfa"
                />
              </div>

              {/* Titles Row */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 14,
                }}
              >
                <div>
                  <Input
                    label="English Title *"
                    name="title"
                    value={form.title}
                    onChange={handleChange}
                  />
                  {errors.title && (
                    <div
                      style={{ fontSize: 10, color: "#e63946", marginTop: 4 }}
                    >
                      {errors.title}
                    </div>
                  )}
                </div>
                <Input
                  label="Romaji Title"
                  name="romajiTitle"
                  value={form.romajiTitle}
                  onChange={handleChange}
                />
              </div>

              {/* Studio + Year Row */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 14,
                }}
              >
                <Input
                  label="Studio"
                  name="studio"
                  value={form.studio}
                  onChange={handleChange}
                  accent="#60a5fa"
                />
                <Input
                  label="Release Year"
                  type="number"
                  name="releaseYear"
                  value={form.releaseYear}
                  onChange={handleChange}
                  min="1960"
                  max="2035"
                  accent="#ffd166"
                />
              </div>

              {/* Status + Episodes Row */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: 14,
                }}
              >
                <Select
                  label="Status"
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  options={STATUSES}
                />
                <Input
                  label="Episodes Watched"
                  type="number"
                  name="episodesWatched"
                  value={form.episodesWatched}
                  onChange={handleChange}
                  min="0"
                />
                <Input
                  label="Total Episodes"
                  type="number"
                  name="totalEpisodes"
                  value={form.totalEpisodes}
                  onChange={handleChange}
                  min="0"
                />
              </div>

              {/* Progress visual */}
              {form.totalEpisodes > 0 && (
                <div className="aform-field">
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: 6,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 10,
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
                        fontSize: 11,
                        color: "#ffd166",
                        fontFamily: "'Inter',sans-serif",
                        fontWeight: 600,
                      }}
                    >
                      {pct.toFixed(0)}%
                    </span>
                  </div>
                  <div
                    style={{
                      height: 5,
                      background: "rgba(255,255,255,0.07)",
                      borderRadius: 3,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${pct}%`,
                        background: "linear-gradient(90deg,#e63946,#ffd166)",
                        borderRadius: 3,
                        transition: "width 0.5s ease",
                      }}
                    />
                  </div>
                </div>
              )}

              <StarRating value={Number(form.rating)} onChange={handleChange} />
              <Input
                label="Historical Setting"
                name="historicalSetting"
                value={form.historicalSetting}
                onChange={handleChange}
                accent="#a78bfa"
              />
              <Textarea
                label="Review / Notes"
                name="notes"
                value={form.notes}
                onChange={handleChange}
                rows={4}
                accent="#60a5fa"
              />

              {errors.submit && (
                <div
                  style={{
                    background: "rgba(230,57,70,0.1)",
                    border: "1px solid rgba(230,57,70,0.35)",
                    borderRadius: 8,
                    padding: "10px 14px",
                    fontSize: 12,
                    color: "#e63946",
                  }}
                >
                  ⚠ {errors.submit}
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: "flex", gap: 12, marginTop: 10 }}>
                <button
                  type="submit"
                  disabled={saving || saved}
                  style={{
                    flex: 1,
                    padding: "13px 20px",
                    borderRadius: 10,
                    border: "none",
                    cursor: saving ? "wait" : "pointer",
                    background: saved
                      ? "linear-gradient(135deg,#059669,#10b981)"
                      : "linear-gradient(135deg,#c1121f,#e63946)",
                    color: "#fff",
                    fontSize: 13,
                    fontFamily: "'Noto Serif JP',serif",
                    fontWeight: 700,
                    letterSpacing: "0.12em",
                    boxShadow: saved
                      ? "0 0 24px rgba(16,185,129,0.4)"
                      : "0 0 24px rgba(193,18,31,0.4)",
                    transition: "all 0.3s",
                    opacity: saving ? 0.7 : 1,
                  }}
                >
                  {saved
                    ? "✓ SAVED!"
                    : saving
                      ? "SAVING…"
                      : isEditing
                        ? "UPDATE ENTRY →"
                        : "SAVE TO ARCHIVE →"}
                </button>
                <button
                  type="button"
                  onClick={() => (onClose ? onClose() : navigate(-1))}
                  style={{
                    padding: "13px 20px",
                    borderRadius: 10,
                    border: "1px solid rgba(255,255,255,0.1)",
                    background: "rgba(255,255,255,0.04)",
                    color: "rgba(240,239,235,0.6)",
                    fontSize: 13,
                    fontFamily: "'Inter',sans-serif",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>

      <style>{`
        @keyframes shimmer { 0%,100%{background-position:0% 50%} 50%{background-position:100% 50%} }
        input,textarea,select { color-scheme: dark; }
        input::placeholder,textarea::placeholder { color: rgba(240,239,235,0.2); }
      `}</style>
    </div>
  );
}
