// "Continue with Google".
// Needs a Google OAuth Client ID in .env as VITE_GOOGLE_CLIENT_ID
// (setup steps are in CHROME_EXTENSION_GUIDE.md).
//
//  - Website:   Google Identity Services popup (accounts.google.com/gsi/client)
//  - Extension: chrome.identity.launchWebAuthFlow (MV3 does not allow loading
//               Google's remote script inside extension pages)
// Both give an access token, which we use to read the user's name/email/photo.
import { isExtension } from "./env";
import type { Profile } from "./history";

export const GOOGLE_CLIENT_ID: string | undefined = import.meta.env.VITE_GOOGLE_CLIENT_ID;
export const isGoogleConfigured = () => !!GOOGLE_CLIENT_ID;

const SCOPES = "openid email profile";

interface GoogleUserInfo {
  sub: string;
  name?: string;
  email?: string;
  picture?: string;
}

const fetchProfile = async (accessToken: string): Promise<Profile> => {
  const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error("Could not read your Google profile");
  const u = (await res.json()) as GoogleUserInfo;
  return {
    id: `google:${u.sub}`,
    name: u.name || u.email || "Google user",
    email: u.email,
    picture: u.picture,
    provider: "google",
  };
};

// ---- Website: Google Identity Services ---------------------------------

interface TokenResponse {
  access_token?: string;
  error?: string;
  error_description?: string;
}

interface GoogleOAuth2 {
  initTokenClient(config: {
    client_id: string;
    scope: string;
    callback: (r: TokenResponse) => void;
    error_callback?: (e: { type: string; message?: string }) => void;
  }): { requestAccessToken(): void };
}

declare global {
  interface Window {
    google?: { accounts: { oauth2: GoogleOAuth2 } };
  }
}

let gisLoading: Promise<void> | null = null;
const loadGis = () => {
  if (window.google?.accounts?.oauth2) return Promise.resolve();
  gisLoading ??= new Promise<void>((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://accounts.google.com/gsi/client";
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => {
      gisLoading = null;
      reject(new Error("Could not load Google sign-in"));
    };
    document.head.appendChild(s);
  });
  return gisLoading;
};

const signInOnWeb = async (): Promise<Profile> => {
  await loadGis();
  const token = await new Promise<string>((resolve, reject) => {
    const client = window.google!.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID!,
      scope: SCOPES,
      callback: (r) =>
        r.access_token ? resolve(r.access_token) : reject(new Error(r.error_description || r.error)),
      error_callback: (e) =>
        reject(new Error(e.type === "popup_closed" ? "Sign-in was cancelled" : e.message || e.type)),
    });
    client.requestAccessToken();
  });
  return fetchProfile(token);
};

// ---- Extension: chrome.identity ------------------------------------------

const signInInExtension = async (): Promise<Profile> => {
  const redirectUri = chrome.identity.getRedirectURL(); // https://<extension-id>.chromiumapp.org/
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.search = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID!,
    response_type: "token",
    redirect_uri: redirectUri,
    scope: SCOPES,
    prompt: "select_account",
  }).toString();

  const responseUrl = await chrome.identity.launchWebAuthFlow({
    url: url.toString(),
    interactive: true,
  });
  if (!responseUrl) throw new Error("Sign-in was cancelled");
  const params = new URLSearchParams(new URL(responseUrl).hash.slice(1));
  const token = params.get("access_token");
  if (!token) throw new Error(params.get("error") || "Google did not return a token");
  return fetchProfile(token);
};

export const signInWithGoogle = (): Promise<Profile> => {
  if (!isGoogleConfigured()) {
    return Promise.reject(new Error("Google sign-in is not set up yet (missing VITE_GOOGLE_CLIENT_ID)"));
  }
  return isExtension() ? signInInExtension() : signInOnWeb();
};
