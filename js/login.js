(function () {
  "use strict";

  const status = document.getElementById("authStatus");
  const loginButton = document.getElementById("linkedinLogin");
  const consent = document.getElementById("authConsent");
  let authReady = false;

  function showStatus(message, type) {
    status.textContent = message;
    status.className = "auth-status" + (type ? " " + type : "");
    status.hidden = !message;
  }

  async function initialize() {
    const auth = window.OpenDynaAuth;
    const oauthError = auth.oauthError();
    const query = new URLSearchParams(window.location.search);

    if (!auth.isConfigured()) {
      showStatus(
        "Authentication is not configured yet. Complete docs/AUTH_SETUP.md first.",
        "warning"
      );
      loginButton.disabled = true;
      return;
    }

    authReady = true;
    loginButton.disabled = !consent.checked;

    if (query.get("deleted") === "1") {
      showStatus("Your OpenDyna account was permanently deleted.", "");
    } else if (oauthError) {
      showStatus(oauthError, "error");
    }

    try {
      const result = await auth.getClient().auth.getSession();
      if (result.error) {
        throw result.error;
      }

      if (result.data.session) {
        window.location.replace(auth.pageUrl("app.html"));
      }
    } catch (error) {
      showStatus(error.message || "Unable to check the current session.", "error");
    }
  }

  consent.addEventListener("change", function () {
    loginButton.disabled = !authReady || !consent.checked;
  });

  loginButton.addEventListener("click", async function () {
    if (!consent.checked) {
      showStatus("Consent is required before continuing with LinkedIn.", "error");
      return;
    }

    loginButton.disabled = true;
    showStatus("Redirecting to LinkedIn...", "");
    window.sessionStorage.setItem(
      "opendynaPendingConsent",
      JSON.stringify({
        version: "2026-06-14",
        acceptedAt: new Date().toISOString()
      })
    );

    try {
      await window.OpenDynaAuth.signInWithLinkedIn();
    } catch (error) {
      window.sessionStorage.removeItem("opendynaPendingConsent");
      showStatus(error.message || "LinkedIn sign-in failed.", "error");
      loginButton.disabled = false;
    }
  });

  initialize();
})();
