import {
  ApolloClient,
  ApolloProvider,
  InMemoryCache,
  createHttpLink,
  from,
} from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { AuthProvider } from "./auth/AuthContext";
import { AUTH_TOKEN_KEY, googleClientId, graphqlUri } from "./config";
import { LanguageProvider } from "./i18n/LanguageContext";
import "./index.css";

const httpLink = createHttpLink({ uri: graphqlUri });

const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  return {
    headers: {
      ...headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  };
});

const client = new ApolloClient({
  link: from([authLink, httpLink]),
  cache: new InMemoryCache(),
});

function Providers({ children }: { children: ReactNode }) {
  const tree = (
    <ApolloProvider client={client}>
      <BrowserRouter>
        <LanguageProvider>
          <AuthProvider>{children}</AuthProvider>
        </LanguageProvider>
      </BrowserRouter>
    </ApolloProvider>
  );

  if (googleClientId) {
    return <GoogleOAuthProvider clientId={googleClientId}>{tree}</GoogleOAuthProvider>;
  }
  return tree;
}

createRoot(document.getElementById("root")!).render(
  <Providers>
    <App />
  </Providers>
);
