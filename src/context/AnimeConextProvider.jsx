import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";

const AnimeContext = createContext(null);

// ── Your Express backend is on port 3005 ─────────────────────────
const BASE = "http://localhost:3005/api/v1";

export function useAnime() {
  const ctx = useContext(AnimeContext);
  if (!ctx)
    throw new Error("useAnime must be used inside AnimeContextProvider");
  return ctx;
}

// Helper function to safely extract an ID from the various API formats
const getSafeId = (item) => {
  if (!item) return null;
  if (typeof item === "string") return item;
  return String(
    item._id ||
      item.id ||
      item.iD ||
      item.idani ||
      item.animeId ||
      item.idanime,
  );
};

// Helper to generate a clean title from an ID if data is missing
const generateFallbackTitle = (idString) => {
  return idString
    .split("-")
    .filter((word) => isNaN(word)) // Remove trailing numbers
    .join(" ")
    .replace(/\b\w/g, (l) => l.toUpperCase()); // Capitalize words
};

export default function AnimeContextProvider({ children }) {
  const [animes, setAnimes] = useState([]);

  // THE FIX: Self-Healing LocalStorage
  const [favorites, setFavorites] = useState(() => {
    try {
      const stored =
        JSON.parse(localStorage.getItem("anitrack_favorites")) ?? [];

      // Upgrade old string IDs into objects immediately so Favorites.jsx NEVER fetches 404s
      return stored.map((item) => {
        if (typeof item === "string") {
          return {
            id: item,
            title: generateFallbackTitle(item),
            // Using placehold.co instead of via.placeholder to fix ERR_CONNECTION_CLOSED
            coverImageUrl:
              "https://placehold.co/300x400/1a1a1a/e63946?text=No+Image",
            status: "Upcoming/Unknown",
            rating: "TBA",
          };
        }
        return item; // It's already an object, leave it alone
      });
    } catch {
      return [];
    }
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Persist favorites to localStorage
  useEffect(() => {
    localStorage.setItem("anitrack_favorites", JSON.stringify(favorites));
  }, [favorites]);

  const fetchAnimes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BASE}/anime`);
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data = await res.json();
      setAnimes(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message);
      console.warn("AnimeContext: could not reach backend →", e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnimes();
  }, [fetchAnimes]);

  const addAnime = useCallback(async (animeData) => {
    const res = await fetch(`${BASE}/anime`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(animeData),
    });
    if (!res.ok) throw new Error("Failed to add anime");
    const body = await res.json();
    const newAnime = body.newAnime ?? body;
    setAnimes((prev) => [...prev, newAnime]);
    return newAnime;
  }, []);

  const updateAnime = useCallback(async (id, animeData) => {
    const res = await fetch(`${BASE}/anime/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(animeData),
    });
    if (!res.ok) throw new Error("Failed to update anime");
    const body = await res.json();
    const updated = body.updatedAnime ?? body;
    setAnimes((prev) => prev.map((a) => (a._id === id ? updated : a)));
    return updated;
  }, []);

  const deleteAnime = useCallback(async (id) => {
    const res = await fetch(`${BASE}/anime/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Failed to delete anime");
    setAnimes((prev) => prev.filter((a) => a._id !== id));

    // Also remove from favorites if deleted
    setFavorites((prev) => prev.filter((f) => getSafeId(f) !== String(id)));
  }, []);

  // THE FIX: Make toggleFavorite smart enough to handle objects OR strings seamlessly
  const toggleFavorite = useCallback((animeObj) => {
    const targetId = getSafeId(animeObj);
    if (!targetId) return;

    setFavorites((prev) => {
      const isAlreadyFavorited = prev.some((f) => getSafeId(f) === targetId);

      if (isAlreadyFavorited) {
        // Remove it
        return prev.filter((f) => getSafeId(f) !== targetId);
      } else {
        // If it's just a string, format it safely. Otherwise, store the whole object.
        const newFav =
          typeof animeObj === "string"
            ? {
                id: animeObj,
                title: generateFallbackTitle(animeObj),
                coverImageUrl:
                  "https://placehold.co/300x400/1a1a1a/e63946?text=No+Image",
              }
            : animeObj;

        return [...prev, newFav];
      }
    });
  }, []);

  const isFavorite = useCallback(
    (id) => {
      const targetId = String(id);
      return favorites.some((f) => getSafeId(f) === targetId);
    },
    [favorites],
  );

  return (
    <AnimeContext.Provider
      value={{
        animes,
        favorites,
        loading,
        error,
        fetchAnimes,
        addAnime,
        updateAnime,
        deleteAnime,
        toggleFavorite,
        isFavorite,
      }}
    >
      {children}
    </AnimeContext.Provider>
  );
}
