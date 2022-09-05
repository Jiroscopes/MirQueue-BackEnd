import "express-session";

declare module "express-session" {
  interface SessionData {
    accessToken: string;
    refreshToken: string;
    saveDate: number;
    expires_in: number;
    username: string;
    email: string;
  }
}