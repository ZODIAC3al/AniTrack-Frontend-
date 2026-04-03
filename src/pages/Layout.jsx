import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";

export default function Layout() {
  return (
    <div style={{ minHeight: "100vh", background: "#0a0404" }}>
      <Navbar />
      {/* paddingTop matches navbar height so content isn't hidden behind it */}
      <main style={{ paddingTop: "62px" }}>
        <Outlet />
      </main>
    </div>
  );
}
