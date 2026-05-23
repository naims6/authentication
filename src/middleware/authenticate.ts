import { NextFunction, Request, Response } from "express";
import { JwtPayload } from "../types/index.js";
import AppError from "../utils/AppError.js";
import { verifyAccessToken } from "../modules/auth/auth.helper.js";
import { StatusCodes } from "http-status-codes";
import { prisma } from "../lib/prisma.js";

const isAuthenticated = async (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  try {
    const cookieToken = req.cookies.accessToken;
    const headerToken = req.headers.authorization?.split(" ")[1];
    const token = headerToken || cookieToken;
    if (!token) {
      throw new AppError(StatusCodes.UNAUTHORIZED, "Unauthorized");
    }

    const decoded = verifyAccessToken(token) as JwtPayload;
    if (!decoded) {
      throw new AppError(StatusCodes.UNAUTHORIZED, "Unauthorized");
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        status: true,
        bannedUntil: true,
      },
    });

    if (!user) {
      throw new AppError(StatusCodes.UNAUTHORIZED, "Unauthorized");
    }

    if (user.status === "DELETED") {
      throw new AppError(
        StatusCodes.FORBIDDEN,
        "Your account has been deleted",
      );
    }

    if (user.status === "BANNED") {
      if (user.bannedUntil && user.bannedUntil > new Date()) {
        throw new AppError(
          StatusCodes.FORBIDDEN,
          `Your account is banned until ${user.bannedUntil.toISOString()}`,
        );
      }

      // If ban has expired, update user status to ACTIVE
      await prisma.user.update({
        where: { id: decoded.userId },
        data: { status: "ACTIVE", bannedUntil: null, banReason: null },
      });
    }

    req.user = {
      userId: decoded.userId,
      email: decoded.email,
    };

    next();
  } catch (error) {
    next(error);
  }
};

export default isAuthenticated;
