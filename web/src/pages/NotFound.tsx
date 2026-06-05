import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
     <div className="min-h-screen flex items-center justify-center bg-gray-100">
          <div className="text-center">
            <h1 className="text-6xl font-bold text-gray-800 mb-4">404</h1>
            <p className="text-2xl text-gray-600 mb-8">Oops! Page not found</p>
            <p className="text-gray-500 mb-4">Maybe this page is under construction.</p>
            <a href="/auth/login" className="text-primary hover:underline">Go to Login</a>
          </div>
        </div>
  );
};

export default NotFound;
