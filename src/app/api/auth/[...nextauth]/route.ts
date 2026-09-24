import { handlers } from "@/server/auth";

/** Auth.js's own endpoints (session, csrf, callback). No application route handler lives here. */
export const { GET, POST } = handlers;
