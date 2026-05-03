const DEFAULT_SERVER = "https://jeempost.onrender.com";

/** Backend (news, images). Must allow your Netlify origin in CORS when called from the browser. */
export const serverUrl =
  import.meta.env.VITE_SERVER_URL?.replace(/\/$/, "") ?? DEFAULT_SERVER;

export const newsUrl = `${serverUrl}/news`;
