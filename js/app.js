(function () {
  "use strict";

  const loading = document.getElementById("appLoading");
  const content = document.getElementById("appContent");
  const status = document.getElementById("appStatus");
  const name = document.getElementById("userName");
  const email = document.getElementById("userEmail");
  const logoutButton = document.getElementById("logoutButton");
  const deleteAccountButton = document.getElementById("deleteAccountButton");

  function showError(message) {
    loading.hidden = true;
    content.hidden = true;
    status.textContent = message;
    status.hidden = false;
  }

  function goToLogin() {
    window.location.replace(window.OpenDynaAuth.pageUrl("login.html"));
  }

  async function recordPendingConsent(client) {
    const pending = window.sessionStorage.getItem("opendynaPendingConsent");
    if (!pending) {
      return;
    }

    let consent;
    try {
      consent = JSON.parse(pending);
    } catch {
      window.sessionStorage.removeItem("opendynaPendingConsent");
      return;
    }

    const result = await client.auth.updateUser({
      data: {
        opendyna_consent_version: consent.version,
        opendyna_consent_at: consent.acceptedAt
      }
    });

    if (result.error) {
      throw result.error;
    }

    window.sessionStorage.removeItem("opendynaPendingConsent");
  }

  async function initialize() {
    const auth = window.OpenDynaAuth;

    if (!auth.isConfigured()) {
      showError("Authentication is not configured. See docs/AUTH_SETUP.md.");
      return;
    }

    try {
      const client = auth.getClient();
      const result = await client.auth.getSession();
      if (result.error) {
        throw result.error;
      }

      if (!result.data.session) {
        goToLogin();
        return;
      }

      await recordPendingConsent(client);

      const userResult = await client.auth.getUser();
      if (userResult.error) {
        throw userResult.error;
      }

      if (!userResult.data.user) {
        goToLogin();
        return;
      }

      const user = userResult.data.user;
      name.textContent = auth.displayName(user);
      email.textContent = user.email || "No email address was returned.";
      loading.hidden = true;
      content.hidden = false;

      client.auth.onAuthStateChange(function (event, session) {
        if (event === "SIGNED_OUT" || !session) {
          goToLogin();
        }
      });
    } catch (error) {
      showError(error.message || "Unable to load the authenticated application.");
    }
  }

  logoutButton.addEventListener("click", async function () {
    logoutButton.disabled = true;
    status.hidden = true;

    try {
      await window.OpenDynaAuth.signOut();
      goToLogin();
    } catch (error) {
      status.textContent = error.message || "Sign out failed.";
      status.hidden = false;
      logoutButton.disabled = false;
    }
  });

  deleteAccountButton.addEventListener("click", async function () {
    const confirmed = window.confirm(
      "Permanently delete your OpenDyna account and associated data? This cannot be undone."
    );

    if (!confirmed) {
      return;
    }

    const verified = window.prompt(
      'Type DELETE to confirm permanent account deletion.'
    );

    if (verified !== "DELETE") {
      status.textContent = "Account deletion was canceled.";
      status.className = "auth-status warning";
      status.hidden = false;
      return;
    }

    deleteAccountButton.disabled = true;
    logoutButton.disabled = true;
    status.textContent = "Deleting your account...";
    status.className = "auth-status";
    status.hidden = false;

    try {
      const client = window.OpenDynaAuth.getClient();
      const result = await client.functions.invoke("delete-account", {
        method: "POST"
      });

      if (result.error) {
        throw result.error;
      }

      await client.auth.signOut({ scope: "local" });
      window.location.replace(
        window.OpenDynaAuth.pageUrl("login.html") + "?deleted=1"
      );
    } catch (error) {
      status.textContent =
        error.message || "The account could not be deleted. Please try again.";
      status.className = "auth-status error";
      status.hidden = false;
      deleteAccountButton.disabled = false;
      logoutButton.disabled = false;
    }
  });

  initialize();
})();
