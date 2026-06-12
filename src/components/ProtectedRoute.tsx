import { Navigate } from 'react-router-dom';
import { useAppStore } from '../lib/store';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAppStore();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-primary">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
