import { StrictMode, useCallback, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import "./index.css";
import { api, type Me } from "./lib/api";
import { Auth } from "./pages/Auth";
import { Dashboard } from "./pages/Dashboard";
import { Landing } from "./pages/Landing";

function App() {
  // undefined while loading, null when signed out.
  const [me, setMe] = useState<Me | null | undefined>(undefined);
  const refresh = useCallback(() => api.me().then(setMe, () => setMe(null)), []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  if (me === undefined) return <div className="min-h-dvh bg-ink" />;

  return (
    <Routes>
      <Route path="/" element={<Landing signedIn={!!me} />} />
      <Route path="/login" element={me ? <Navigate to="/app" replace /> : <Auth mode="login" onAuthed={refresh} />} />
      <Route
        path="/register"
        element={me ? <Navigate to="/app" replace /> : <Auth mode="register" onAuthed={refresh} />}
      />
      <Route path="/app" element={me ? <Dashboard me={me} refresh={refresh} /> : <Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
