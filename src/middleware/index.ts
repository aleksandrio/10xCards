import { defineMiddleware } from "astro:middleware";
import { createSupabaseServerInstance } from "../db/supabase.client.ts";

// Public paths that don't require authentication
const PUBLIC_PATHS = [
  "/",
  "/login",
  "/register",
  "/forgot-password",
  "/update-password",
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/logout",
];

// Guest-only paths that redirect authenticated users to dashboard
const GUEST_ONLY_PATHS = ["/login", "/register"];

export const onRequest = defineMiddleware(async ({ locals, cookies, url, request, redirect }, next) => {
  // Create server-side Supabase client
  const supabase = createSupabaseServerInstance({
    cookies,
    headers: request.headers,
  });

  // Store supabase instance in locals for use in API routes
  locals.supabase = supabase;

  // Get the current user session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If user is authenticated, store in locals
  if (user) {
    locals.user = {
      email: user.email,
      id: user.id,
    };

    // Redirect authenticated users away from guest-only pages
    if (GUEST_ONLY_PATHS.includes(url.pathname)) {
      return redirect("/dashboard");
    }
  } else {
    // User is not authenticated
    // Redirect to login if trying to access protected route
    if (!PUBLIC_PATHS.includes(url.pathname) && !url.pathname.startsWith("/api/")) {
      return redirect("/login");
    }
  }

  return next();
});
