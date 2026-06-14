import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useAppStore } from './lib/store';
import { ThemeProvider } from './contexts/ThemeContext';
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

function ComingSoon({ title }: { title: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="font-display font-black uppercase text-3xl tracking-wide mb-2">{title}</h1>
        <p className="text-text-muted">Coming soon</p>
      </div>
    </div>
  );
}

export default function App() {
  const { initialize, loading, user, profile } = useAppStore();

  useEffect(() => {
    initialize();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-primary">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <ThemeProvider role={profile?.role}>
      <BrowserRouter>
        <Sidebar />
        <div className={user ? 'md:ml-[200px] pb-[60px] md:pb-0' : ''}>
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
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/saved" element={<ProtectedRoute><ComingSoon title="Saved" /></ProtectedRoute>} />
            <Route path="/watchlist" element={<ProtectedRoute><ComingSoon title="Watchlist" /></ProtectedRoute>} />
            <Route path="/roster" element={<ProtectedRoute><ComingSoon title="Roster" /></ProtectedRoute>} />
            <Route path="/opportunities" element={<ComingSoon title="Opportunities" />} />
          </Routes>
        </div>
      </BrowserRouter>
    </ThemeProvider>
  );
}
