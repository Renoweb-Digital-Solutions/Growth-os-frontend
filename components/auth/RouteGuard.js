"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

export default function RouteGuard({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isMounted, setIsMounted] = useState(false);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsMounted(true);
    }, 0);

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
        const search = typeof window !== "undefined" ? window.location.search : "";
        const searchParams = new URLSearchParams(search);
        const isOAuthCallback =
          searchParams.has("meta_status") ||
          searchParams.has("google_status") ||
          searchParams.has("google_error") ||
          searchParams.has("linkedin_status") ||
          searchParams.has("x_status");

        if (isOAuthCallback) {
          if (!searchParams.has("tab")) {
            searchParams.set("tab", "integrations");
          }
          router.push(`/dashboard/settings?${searchParams.toString()}`);
        } else {
          router.push("/dashboard");
        }
      } else {
        setAuthorized(true);
      }
    };

    authCheck();

    return () => {
      clearTimeout(timer);
    };
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
