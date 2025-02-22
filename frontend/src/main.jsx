import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { Auth0Provider } from "@auth0/auth0-react";
import { UserProvider } from "./components/UserProvider"; // Import UserProvider

const domain = "dev-nfmvvmocdf0wh8xi.us.auth0.com";
const clientID = "V7r7ltPx8oRkJ718n9P91ZOIJFmkMnFu";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Auth0Provider
      domain={domain}
      clientId={clientID}
      authorizationParams={{ redirect_uri: window.location.origin }}
    >
      <UserProvider> {/* Wrap everything inside UserProvider */}
        <App />
      </UserProvider>
    </Auth0Provider>
  </React.StrictMode>
);
