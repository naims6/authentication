import { NextFunction, Request, Response } from "express";
import { JwtPayload } from "../types";
import AppError from "../utils/AppError";
import { verifyAccessToken } from "../modules/auth/auth.helper";

const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  try {
    const cookieToken = req.cookies.accessToken;
    const headerToken = req.headers.authorization?.split(" ")[1];

    const token = headerToken || cookieToken;

    if (!token) {
      throw new AppError(401, "Unauthorized");
    }

    const decoded = verifyAccessToken(token) as JwtPayload;

    if (!decoded) {
      throw new AppError(401, "Unauthorized");
    }

    req.user = {
      userId: decoded.userId,
      email: decoded.email,
    };

    next();
  } catch (error) {
    throw new AppError(401, "Unauthorized");
  }
};

export default isAuthenticated;
