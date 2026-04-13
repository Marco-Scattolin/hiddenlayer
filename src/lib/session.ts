import type { SessionOptions } from "iron-session";

export interface SessionData {
  username: string;
}

export const ADMIN_USERNAME = "marco";

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET!,
  cookieName: "hl-session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
  },
};
