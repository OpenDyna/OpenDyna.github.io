(function () {
  "use strict";

  let client;

  function getConfig() {
    return window.OPENDYNA_AUTH_CONFIG || {};
  }

  function isConfigured() {
    const config = getConfig();
    return Boolean(
      config.supabaseUrl &&
      config.supabasePublishableKey &&
      !config.supabaseUrl.includes("YOUR_PROJECT_REF") &&
      !config.supabasePublishableKey.includes("REPLACE_ME")
    );
  }

  function getClient() {
    if (!isConfigured()) {
      throw new Error("Supabase authentication has not been configured.");
    }

    if (!window.supabase || typeof window.supabase.createClient !== "function") {
      throw new Error("The Supabase client library failed to load.");
    }

    if (!client) {
      const config = getConfig();
      client = window.supabase.createClient(
        config.supabaseUrl,
        config.supabasePublishableKey,
        {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true
          }
        }
      );
    }

    return client;
  }

  function pageUrl(pageName) {
    return new URL(pageName, window.location.href).href;
  }

  function oauthError() {
    const query = new URLSearchParams(window.location.search);
    const fragment = new URLSearchParams(window.location.hash.slice(1));
    return (
      fragment.get("error_description") ||
      query.get("error_description") ||
      fragment.get("error") ||
      query.get("error") ||
      ""
    );
  }

  function displayName(user) {
    const metadata = user && user.user_metadata ? user.user_metadata : {};
    return (
      metadata.full_name ||
      metadata.name ||
      [metadata.given_name, metadata.family_name].filter(Boolean).join(" ") ||
      user.email ||
      "Signed-in user"
    );
  }

  async function signInWithLinkedIn() {
    const auth = getClient();
    const result = await auth.auth.signInWithOAuth({
      provider: "linkedin_oidc",
      options: {
        redirectTo: pageUrl("app.html")
      }
    });

    if (result.error) {
      throw result.error;
    }
  }

  async function signOut() {
    const result = await getClient().auth.signOut();
    if (result.error) {
      throw result.error;
    }
  }

  window.OpenDynaAuth = Object.freeze({
    displayName,
    getClient,
    isConfigured,
    oauthError,
    pageUrl,
    signInWithLinkedIn,
    signOut
  });
})();
