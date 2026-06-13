import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useAppStore } from './lib/store';
import Navbar from './components/Navbar';
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

export default function App() {
  const { initialize, loading } = useAppStore();

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
    <BrowserRouter>
      <Navbar />
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
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/calendar" element={<Calendar />} />
        <Route path="/opportunities" element={
          <div className="min-h-screen bg-primary flex items-center justify-center">
            <div className="text-center">
              <h1 className="font-display font-black uppercase text-3xl tracking-wide mb-2">Opportunities</h1>
              <p className="text-text-muted">Coming soon</p>
            </div>
          </div>
        } />
      </Routes>
    </BrowserRouter>
  );
}
