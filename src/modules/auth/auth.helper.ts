import jwt from "jsonwebtoken";
import config from "../../config/env";
import { JwtPayload, RefreshTokenPayload } from "../../types";

export const createAccessToken = (payload: JwtPayload) => {
  return jwt.sign(payload, config.jwt_access_secret, {
    expiresIn: "5m",
  });
};

export const createRefreshToken = (payload: RefreshTokenPayload) => {
  return jwt.sign(payload, config.jwt_refresh_secret, {
    expiresIn: "7d",
  });
};

export const verifyAccessToken = (token: string) => {
  return jwt.verify(token, config.jwt_access_secret) as JwtPayload;
};

export const verifyRefreshToken = (token: string) => {
  return jwt.verify(token, config.jwt_refresh_secret) as RefreshTokenPayload;
};

export const createResetToken = (payload: string) => {
  return jwt.sign({ email: payload }, config.jwt_reset_secret, {
    expiresIn: "10m",
  });
};

export const verifyResetToken = (token: string) => {
  return jwt.verify(token, config.jwt_reset_secret) as { email: string };
};

export const createTempLoginToken = (payload: {
  userId: string;
  email: string;
}) => {
  return jwt.sign(payload, process.env.JWT_2FA_SECRET!, {
    expiresIn: "5m",
  });
};

export const verifyTempLoginToken = (token: string) => {
  return jwt.verify(token, process.env.JWT_2FA_SECRET!) as {
    userId: string;
    email: string;
  };
};

export const generateSessionId = () => {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
};
