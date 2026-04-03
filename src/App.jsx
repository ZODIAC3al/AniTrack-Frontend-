import AnimeContextProvider from "./context/AnimeConextProvider.jsx";
import Favorites from "./pages/Favorates.jsx";
import Home from "./pages/Home.jsx";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Top from "./pages/Top.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Layout from "./pages/Layout.jsx";
import AnimeDetails from "./pages/AnimeDetails.jsx";
import WatchPage from "./pages/WatchPage.jsx";
import NotFound from "./pages/NotFound.jsx";
import AnimeForm from "./components/AnimeForm.jsx";

// ── Your Express backend runs on port 3005 ──────────────────────
export const BASE = "http://localhost:3005/api/v1";

// ── Loaders ──────────────────────────────────────────────────────
export const topAnimesLoader = async () => {
  const res = await fetch(`${BASE}/anime`);
  if (!res.ok) throw new Error("Failed to fetch animes");
  return res.json();
};

export const animeDetailsLoader = async ({ params }) => {
  // 1. Fetch from your info.js scraper route instead of the database
  const res = await fetch(`${BASE}/related/${params.id}`);

  if (!res.ok) throw new Error("Anime not found");
  const data = await res.json();

  // 2. Your info.js splits data into an array (infoX). Let's grab the parts.
  const baseInfo = data.infoX[0] || {};
  const extraInfo = data.infoX[1] || {};

  // 3. Map Aniwatch's variable names to the names AnimeDetails.jsx expects
  return {
    id: baseInfo.id || params.id,
    title: baseInfo.name,
    romajiTitle: baseInfo.jname,
    description: baseInfo.desc,
    image: baseInfo.image,
    // Try to get total episodes, fallback to subbed episodes if total is missing
    totalEpisodes: parseInt(baseInfo.totalep) || parseInt(baseInfo.epsub) || 0,
    status: extraInfo.statusAnime || "Unknown",
    rating: extraInfo.malscore,
    releaseYear: extraInfo.premired || extraInfo.aired,
    studio: extraInfo.studio,
    genres: extraInfo.genre || [],
  };
};

const RootLoading = () => (
  <div
    style={{
      height: "100vh",
      background: "#0a0404",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "#e63946",
    }}
  >
    Loading Watcher...
  </div>
);
function App() {
  const router = createBrowserRouter([
    {
      path: "/",
      element: <Layout />,
      errorElement: <NotFound />,
      children: [
        { index: true, element: <Home /> },
        { path: "favorites", element: <Favorites /> },
        { path: "top-animes", element: <Top />, loader: topAnimesLoader },
        { path: "dashboard", element: <Dashboard /> },
        { path: "add-anime", element: <AnimeForm /> },
        {
          path: "animes/:id",
          element: <AnimeDetails />,
          loader: animeDetailsLoader,
        },
        {
          path: "animes/:id/watch",
          element: <WatchPage />,
          loader: animeDetailsLoader,
        },
        { path: "*", element: <NotFound /> },
        {
          path: "animes/:id/watch",
          element: <WatchPage />,
          loader: animeDetailsLoader, // Assuming you have a loader
          hydrateFallbackElement: (
            <div style={{ color: "white" }}>Loading...</div>
          ), // Add this
        },
      ],
    },
  ]);

  return (
    <AnimeContextProvider>
      <RouterProvider router={router} fallbackElement={<RootLoading />} />
    </AnimeContextProvider>
  );
}

export default App;
