import jwt from "jsonwebtoken";
import config from "../../config/env";
import { JwtPayload, RefreshTokenPayload } from "../../types";

export const createAccessToken = (payload: JwtPayload) => {
  return jwt.sign(payload, config.jwt_secret, {
    expiresIn: "15m",
  });
};

export const createRefreshToken = (payload: RefreshTokenPayload) => {
  return jwt.sign(payload, config.jwt_refresh_secret, {
    expiresIn: "7d",
  });
};

export const verifyAccessToken = (token: string) => {
  return jwt.verify(token, config.jwt_secret) as JwtPayload;
};

export const verifyRefreshToken = (token: string) => {
  return jwt.verify(token, config.jwt_refresh_secret) as RefreshTokenPayload;
};

export const generateSessionId = () => {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
};
