import { StatusCodes } from "http-status-codes";
import { prisma } from "../../lib/prisma";
import AppError from "../../utils/AppError";
import { hashPassword, verifyPassword } from "../../utils/hashPassword";
import { generateOTP, hashOTP, verifyOTP } from "../../utils/otp";
import { sendVerificationEmail } from "../../utils/sendVerificationEmail";
import { EmailVerify, UserCreate, UserLogin } from "./auth.validation";
import { OTPType } from "@prisma/client";
import { JwtPayload } from "../../types";
import {
  createAccessToken,
  createRefreshToken,
  generateSessionId,
} from "./auth.helper";

const registerUser = async (payload: UserCreate) => {
  const { email, password, fullName } = payload;
  const hashedPassword = await hashPassword(password);
  const otp = generateOTP();
  const hashedOTP = await hashOTP(otp);

  const result = await prisma.$transaction(
    async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          fullName,
        },
        select: { id: true, email: true, fullName: true, isVerified: true },
      });

      await tx.oTP.create({
        data: {
          userId: newUser.id,
          code: hashedOTP,
          expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        },
      });
      return newUser;
    },
    {
      maxWait: 10000,
      timeout: 15000,
    },
  );
  await sendVerificationEmail(result.email, result.fullName, otp);

  return result;
};

const verifyEmail = async (payload: EmailVerify) => {
  const { email, otp } = payload;
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, isVerified: true, fullName: true },
  });

  if (!user) {
    throw new AppError(StatusCodes.BAD_REQUEST, "User not found");
  }

  const otpRecord = await prisma.oTP.findUnique({
    where: {
      userId_type: {
        userId: user.id,
        type: OTPType.VERIFICATION,
      },
    },
  });

  if (!otpRecord) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Invalid OTP");
  }

  if (otpRecord.expiresAt < new Date()) {
    throw new AppError(StatusCodes.BAD_REQUEST, "OTP has expired");
  }

  const isOTPValid = await verifyOTP(otp, otpRecord.code);

  if (!isOTPValid) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Wrong OTP");
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { isVerified: true },
  });

  await prisma.oTP.delete({
    where: { id: otpRecord.id },
  });

  return user;
};

const loginUser = async (payload: UserLogin) => {
  const { email, password } = payload;
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      fullName: true,
      password: true,
      isVerified: true,
    },
  });

  if (!user) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Invalid email or password");
  }

  const isPasswordValid = await verifyPassword(password, user.password);

  if (!isPasswordValid) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Invalid email or password");
  }

  if (!user.isVerified) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "Please verify your email address before logging in",
    );
  }

  const jwtPayload: JwtPayload = {
    userId: user.id,
    email: user.email,
  };

  const sessionId = generateSessionId();
  const accessToken = createAccessToken(jwtPayload);
  const refreshToken = createRefreshToken({
    userId: user.id,
    sessionId,
  });

  return { accessToken, refreshToken };
};

const logoutUser = async (userId: string, refreshToken: string) => {

}

export const AuthService = {
  registerUser,
  loginUser,
  verifyEmail,
  logoutUser,
};
