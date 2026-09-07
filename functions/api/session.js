import { isAuthenticated } from "./_auth.js";

export async function onRequestGet({ request, env }) {
  const ok = await isAuthenticated(request, env);
  return new Response(JSON.stringify({ authenticated: ok }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
