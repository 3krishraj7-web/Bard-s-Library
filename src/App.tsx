import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { AudioProvider } from "./context/AudioContext";
import { AppLayout } from "./components/layout/AppLayout";
import { HomeView } from "./components/home/HomeView";
import { LibraryView } from "./components/library/LibraryView";
import { ReaderView } from "./components/reader/ReaderView";
import { ThemeSettings } from "./components/settings/ThemeSettings";

export default function App() {
  return (
    <AudioProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<AppLayout />}>
            <Route index element={<HomeView />} />
            <Route path="library" element={<LibraryView />} />
            <Route path="reader" element={<ReaderView />} />
            <Route path="settings" element={<ThemeSettings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </HashRouter>
    </AudioProvider>
  );
}
