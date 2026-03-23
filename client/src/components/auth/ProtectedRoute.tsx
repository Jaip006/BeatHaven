import React, { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { getAuthSession, hydrateAuthSession } from '../../utils/auth';

const ProtectedRoute: React.FC = () => {
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(Boolean(getAuthSession()));
  const location = useLocation();

  useEffect(() => {
    let isMounted = true;

    const checkAuth = async () => {
      const session = getAuthSession();

      if (session) {
        if (isMounted) {
          setIsAuthenticated(true);
          setIsChecking(false);
        }
        return;
      }

      const hydratedSession = await hydrateAuthSession();

      if (isMounted) {
        setIsAuthenticated(Boolean(hydratedSession));
        setIsChecking(false);
      }
    };

    void checkAuth();

    return () => {
      isMounted = false;
    };
  }, [location.pathname]);

  if (isChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0B0B0B] text-sm text-[#B3B3B3]">
        Loading your session...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/sign-in" replace state={{ from: location }} />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
