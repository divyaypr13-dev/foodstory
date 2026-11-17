import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import LoadingSkeleton from './LoadingSkeleton.jsx';
import EmptyState from './EmptyState.jsx';
import { ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-10">
        <LoadingSkeleton variant="list" count={3} />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (roles && roles.length > 0 && !roles.includes(user.role)) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <EmptyState
          icon={ShieldAlert}
          title="Access restricted"
          description="Your current account role does not have permission to view this section."
          action={
            <Link
              to="/"
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-[#E23E3E] text-white text-sm font-medium hover:bg-[#c83232] transition-colors"
            >
              Return Home
            </Link>
          }
        />
      </div>
    );
  }

  return children;
}
