
import { createRoot } from "react-dom/client";
import { Auth0Provider, AppState } from "@auth0/auth0-react";
import App from "./app/App.tsx";
import "./styles/index.css";

const domain = import.meta.env.VITE_AUTH0_DOMAIN;
const clientId = import.meta.env.VITE_AUTH0_CLIENT_ID;

if (!domain || !clientId) {
  console.error("Missing Auth0 configuration in environment variables.");
}

const onRedirectCallback = (appState?: AppState) => {
  const returnTo = appState?.returnTo || window.location.origin + window.location.pathname;
  console.log("Auth0: Redirecting back to:", returnTo);
  window.history.replaceState(
    {},
    document.title,
    returnTo
  );
};

console.log("Auth0: Initializing with:", {
  domain,
  clientId,
  redirect_uri: window.location.origin,
});

createRoot(document.getElementById("root")!).render(
  <Auth0Provider
    domain={domain || ""}
    clientId={clientId || ""}
    authorizationParams={{
      redirect_uri: window.location.origin,
      scope: "openid profile email",
    }}
    onRedirectCallback={onRedirectCallback}
    cacheLocation="localstorage"
    useRefreshTokens={true}
    useRefreshTokensFallback={true}
    legacySameSiteCookie={true} // Helps with some cross-site/localhost scenarios
    onBeforeInternalNavigation={(target) => {
      console.log("Auth0: onBeforeInternalNavigation to:", target);
      return true;
    }}
  >
    <App />
  </Auth0Provider>
);
  