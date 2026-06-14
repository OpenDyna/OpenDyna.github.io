import { createClient } from "https://esm.sh/@supabase/supabase-js@2.108.1";

const allowedOrigins = new Set([
  "https://www.opendyna.com",
  "https://opendyna.com"
]);

function isAllowedOrigin(origin: string): boolean {
  return (
    allowedOrigins.has(origin) ||
    /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)
  );
}

function corsHeaders(origin: string): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin"
  };
}

function jsonResponse(
  body: Record<string, unknown>,
  status: number,
  origin: string
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders(origin),
      "Content-Type": "application/json"
    }
  });
}

Deno.serve(async (request: Request) => {
  const origin = request.headers.get("Origin") || "";

  if (!isAllowedOrigin(origin)) {
    return new Response("Origin not allowed.", { status: 403 });
  }

  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders(origin) });
  }

  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed." }, 405, origin);
  }

  const authorization = request.headers.get("Authorization") || "";
  const accessToken = authorization.startsWith("Bearer ")
    ? authorization.slice(7)
    : "";

  if (!accessToken) {
    return jsonResponse({ error: "Authentication required." }, 401, origin);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    console.error("Required Supabase function environment variables are missing.");
    return jsonResponse({ error: "Server configuration error." }, 500, origin);
  }

  const userClient = createClient(supabaseUrl, anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  const userResult = await userClient.auth.getUser(accessToken);

  if (userResult.error || !userResult.data.user) {
    return jsonResponse({ error: "Invalid or expired session." }, 401, origin);
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  const deleteResult = await adminClient.auth.admin.deleteUser(
    userResult.data.user.id
  );

  if (deleteResult.error) {
    console.error("Account deletion failed:", deleteResult.error.message);
    return jsonResponse({ error: "Account deletion failed." }, 500, origin);
  }

  return jsonResponse({ deleted: true }, 200, origin);
});
