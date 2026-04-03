import { useEffect, useState } from "react";
import AnimeCard from "../components/AnimeCard";

const ANIWATCH = "https://aniwatch-api-v1-0.onrender.com";

export default function Top() {
  const [topAnimeData, setTopAnimeData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // You can swap this to whatever specific Aniwatch endpoint you prefer for Top Animes
    fetch(`${ANIWATCH}/api/parse`)
      .then((r) => r.json())
      .then((d) => {
        // Assuming we want to use the 'trend' array for top animes
        const trending = d?.trend || [];

        // Normalize the data immediately so the rest of the app doesn't have to guess the keys
        const normalizedList = trending.map((a) => ({
          id: a.iD,
          title: a.name,
          coverImageUrl: a.imgAni,
          rating: a.ranking,
          status: "Top Rated",
        }));

        setTopAnimeData(normalizedList);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch top animes:", err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div style={{ color: "white", padding: "100px", textAlign: "center" }}>
        Loading Top Animes...
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0a0404",
        color: "#f0efeb",
        padding: "80px 60px",
      }}
    >
      <h1
        style={{
          fontFamily: "'Noto Serif JP',serif",
          fontSize: 32,
          marginBottom: 40,
        }}
      >
        Top Animes
      </h1>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))",
          gap: 20,
        }}
      >
        {topAnimeData.map((anime, i) => (
          // Because 'anime' is fully normalized, the AnimeCard can safely pass it to toggleFavorite
          <AnimeCard key={anime.id} index={i} anime={anime} />
        ))}
      </div>
    </div>
  );
}
