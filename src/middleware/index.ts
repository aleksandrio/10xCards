import { defineMiddleware } from "astro:middleware";

import { supabaseClient, DEFAULT_USER_ID } from "../db/supabase.client.ts";

export const onRequest = defineMiddleware((context, next) => {
  context.locals.supabase = supabaseClient;
  // TODO: Replace with real authentication
  context.locals.user = {
    id: DEFAULT_USER_ID,
  };
  return next();
});
