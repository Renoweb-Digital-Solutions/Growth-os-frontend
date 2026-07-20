"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

export default function RouteGuard({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isMounted, setIsMounted] = useState(false);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const authCheck = () => {
      const token = localStorage.getItem("token");
      
      // Define public vs protected paths
      const isAuthRoute = pathname.startsWith('/auth') || pathname === '/';
      const isProtectedRoute = pathname.startsWith('/dashboard') || pathname.startsWith('/onboarding');
      
      if (!token && isProtectedRoute) {
        setAuthorized(false);
        router.push("/auth");
      } else if (token && isAuthRoute) {
        setAuthorized(false);
        router.push("/dashboard");
      } else {
        setAuthorized(true);
      }
    };

    authCheck();
  }, [pathname, router]);

  const isProtectedRoute = pathname.startsWith('/dashboard') || pathname.startsWith('/onboarding');

  // Prevent hydration mismatch and flash of protected content
  if (!isMounted && isProtectedRoute) {
    return null; 
  }

  // If mounted and not authorized on a protected route, show nothing while redirecting
  if (isMounted && !authorized && isProtectedRoute) {
    return null;
  }

  return children;
}
