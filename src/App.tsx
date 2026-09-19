import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useAppStore } from './lib/store';
import { ThemeProvider } from './contexts/ThemeContext';
import { ThemeModeProvider } from './contexts/ThemeMode';
import Sidebar from './components/Sidebar';
import ProtectedRoute from './components/ProtectedRoute';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import ProfileEdit from './pages/ProfileEdit';
import Upload from './pages/Upload';
import Discover from './pages/Discover';
import Feed from './pages/Feed';
import Home from './pages/Home';
import Leaderboard from './pages/Leaderboard';
import Calendar from './pages/Calendar';
import Training from './pages/Training';
import TrainingLog from './pages/TrainingLog';
import TrainingProgress from './pages/TrainingProgress';
import Messages from './pages/Messages';
import Meets from './pages/Meets';
import AdminImport from './pages/AdminImport';
import ClaimProfile from './pages/ClaimProfile';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import SplashScreen from './components/SplashScreen';

export default function App() {
  const { initialize, loading, user, profile } = useAppStore();

  useEffect(() => {
    initialize();
  }, []);

  // The splash stays mounted through its own fade, so the app renders behind it
  // rather than after it — that is what removes the white gap on a slow session
  // resolve. While `loading` is true there is no user yet, so the routes below
  // render their signed-out state and the splash covers the swap.
  return (
    <ThemeModeProvider>
    <ThemeProvider role={profile?.role}>
      <SplashScreen ready={!loading} />
      <BrowserRouter>
        <Sidebar />
        <div className={user ? 'md:ml-[220px] pt-[56px] md:pt-0 pb-[64px] md:pb-0' : ''}>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/profile/edit" element={<ProtectedRoute><ProfileEdit /></ProtectedRoute>} />
            <Route path="/profile/:username" element={<Profile />} />
            <Route path="/upload" element={<ProtectedRoute><Upload /></ProtectedRoute>} />
            <Route path="/discover" element={<Discover />} />
            <Route path="/feed" element={<ProtectedRoute><Feed /></ProtectedRoute>} />
            <Route path="/training" element={<ProtectedRoute><Training /></ProtectedRoute>} />
            <Route path="/training/log" element={<ProtectedRoute><TrainingLog /></ProtectedRoute>} />
            <Route path="/training/progress" element={<ProtectedRoute><TrainingProgress /></ProtectedRoute>} />
            <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
            <Route path="/meets" element={<Meets />} />
            <Route path="/claim/:username" element={<ClaimProfile />} />
            <Route path="/admin/import" element={<ProtectedRoute><AdminImport /></ProtectedRoute>} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
          </Routes>
        </div>
      </BrowserRouter>
    </ThemeProvider>
    </ThemeModeProvider>
  );
}
