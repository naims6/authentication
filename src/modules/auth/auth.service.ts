import { StatusCodes } from "http-status-codes";
import { prisma } from "../../lib/prisma";
import AppError from "../../utils/AppError";
import { hashPassword, verifyPassword } from "../../utils/hashPassword";
import { generateOTP, hashOTP, verifyOTP } from "../../utils/otp";
import { sendVerificationEmail } from "../../utils/sendVerificationEmail";
import {
  ChangePassword,
  EmailVerify,
  UserCreate,
  UserLogin,
} from "./auth.validation";
import { OTPType } from "@prisma/client";
import { JwtPayload, RefreshTokenPayload } from "../../types";
import {
  createAccessToken,
  createRefreshToken,
  createResetToken,
  generateSessionId,
  verifyRefreshToken,
  verifyResetToken,
} from "./auth.helper";
import { IResult } from "ua-parser-js";

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

  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: { isVerified: true },
  });

  await prisma.oTP.delete({
    where: { id: otpRecord.id },
  });

  return updatedUser;
};

const forgotPassword = async (email: string) => {
  const user = await prisma.user.findUnique({
    where: { email },
  });
  if (!user) {
    throw new AppError(StatusCodes.BAD_REQUEST, "User not found");
  }

  const otp = generateOTP();
  const hashedOTP = await hashOTP(otp);

  const otpRecord = await prisma.oTP.upsert({
    where: {
      userId_type: {
        userId: user.id,
        type: OTPType.PASSWORD_RESET,
      },
    },
    update: {
      code: hashedOTP,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    },
    create: {
      userId: user.id,
      code: hashedOTP,
      type: OTPType.PASSWORD_RESET,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    },
  });

  await sendVerificationEmail(user.email, user.fullName, otp);

  return otpRecord;
};

const verifyForgotPasswordOTP = async (payload: EmailVerify) => {
  const { email, otp } = payload;
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new AppError(StatusCodes.BAD_REQUEST, "User not found");
  }

  const otpRecord = await prisma.oTP.findUnique({
    where: {
      userId_type: {
        userId: user.id,
        type: OTPType.PASSWORD_RESET,
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

  const resetToken = createResetToken(user.email);

  return { resetToken };
};

const resetPassword = async (resetToken: string, newPassword: string) => {
  const resetTokenPayload = verifyResetToken(resetToken);
  if (!resetTokenPayload) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Invalid reset token");
  }

  const user = await prisma.user.findUnique({
    where: { email: resetTokenPayload.email },
  });

  if (!user) {
    throw new AppError(StatusCodes.BAD_REQUEST, "User not found");
  }

  const hashedPassword = await hashPassword(newPassword);

  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: { password: hashedPassword },
    select: { id: true, email: true, fullName: true, isVerified: true },
  });

  // TODO: Use Transaction
  await prisma.oTP.delete({
    where: {
      userId_type: {
        userId: user.id,
        type: OTPType.PASSWORD_RESET,
      },
    },
  });

  await prisma.session.deleteMany({
    where: { userId: user.id },
  });

  return updatedUser;
};

const refreshToken = async (refreshToken: string) => {
  const refreshTokenPayload = verifyRefreshToken(refreshToken);
  if (!refreshTokenPayload) {
    throw new AppError(StatusCodes.UNAUTHORIZED, "Invalid refresh token");
  }

  const newAccessToken = createAccessToken({
    userId: refreshTokenPayload.userId,
    email: refreshTokenPayload.email,
  });

  const newRefreshToken = createRefreshToken({
    userId: refreshTokenPayload.userId,
    email: refreshTokenPayload.email,
    sessionId: refreshTokenPayload.sessionId,
  });

  const session = await prisma.session.update({
    where: {
      refreshToken: refreshToken,
    },
    data: {
      refreshToken: newRefreshToken,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
    },
  });

  return { newAccessToken, newRefreshToken };
};

const resendOtp = async (email: string) => {
  const user = await prisma.user.findUnique({
    where: { email },
  });
  if (!user) {
    throw new AppError(StatusCodes.BAD_REQUEST, "User not found");
  }

  const otp = generateOTP();
  const hashedOTP = await hashOTP(otp);

  const otpRecord = await prisma.oTP.upsert({
    where: {
      userId_type: {
        userId: user.id,
        type: OTPType.VERIFICATION,
      },
    },
    update: {
      code: hashedOTP,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    },
    create: {
      userId: user.id,
      code: hashedOTP,
      type: OTPType.VERIFICATION,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    },
  });

  await sendVerificationEmail(user.email, user.fullName, otp);

  return otpRecord;
};

const changePassword = async (
  userId: string,
  payload: ChangePassword,
  refreshToken: string,
) => {
  const { oldPassword, newPassword, confirmPassword } = payload;

  if (oldPassword === newPassword) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "Old password and new password cannot be the same",
    );
  }

  if (newPassword !== confirmPassword) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "New password and confirm password do not match",
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new AppError(StatusCodes.BAD_REQUEST, "User not found");
  }

  const isPasswordValid = await verifyPassword(oldPassword, user.password);
  if (!isPasswordValid) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Invalid old password");
  }

  const hashedPassword = await hashPassword(newPassword);

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
  });

  const removeOtherSessions = await prisma.session.deleteMany({
    where: { userId: userId, NOT: { refreshToken } },
  });

  const newAccessToken = createAccessToken({
    userId: updatedUser.id,
    email: updatedUser.email,
  });

  const sessionId = generateSessionId();
  const newRefreshToken = createRefreshToken({
    userId: updatedUser.id,
    email: updatedUser.email,
    sessionId,
  });

  return { newAccessToken, newRefreshToken };
};

const loginUser = async (
  payload: UserLogin,
  sessionInfo: IResult,
  ip: string,
) => {
  const deviceName = sessionInfo.os.name || "Unknown OS";
  const browserName = sessionInfo.browser.name || "Unknown Browser";

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
    email: user.email,
    sessionId,
  });

  const session = await prisma.session.create({
    data: {
      userId: user.id,
      refreshToken,
      sessionId,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
      deviceInfo: `${deviceName} - ${browserName}`,
      ipAddress: ip,
    },
  });
  return { accessToken, refreshToken };
};

const getAllSessions = async (userId: string) => {
  const sessions = await prisma.session.findMany({
    where: { userId },
    select: {
      id: true,
      deviceInfo: true,
      sessionId: true,
    },
  });
  return sessions;
};

const logoutUser = async (userId: string, refreshToken: string) => {
  const isRefreshTokenValid = verifyRefreshToken(refreshToken);
  if (!isRefreshTokenValid) {
    throw new AppError(StatusCodes.UNAUTHORIZED, "Invalid refresh token");
  }

  const session = await prisma.session.findUnique({
    where: {
      refreshToken: refreshToken,
    },
  });

  if (!session) {
    throw new AppError(StatusCodes.UNAUTHORIZED, "Invalid refresh token");
  }

  await prisma.session.delete({
    where: {
      refreshToken,
    },
  });

  return session;
};

const logoutSingleDevice = async (userId: string, sessionId: string) => {
  const session = await prisma.session.findUnique({
    where: { userId, sessionId },
  });

  if (!session) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Session not found");
  }

  await prisma.session.delete({
    where: { userId, sessionId },
  });

  return session;
};

const logoutAllDevice = async (userId: string) => {
  const result = await prisma.session.deleteMany({
    where: {
      userId,
    },
  });

  if (result.count === 0) {
    throw new AppError(StatusCodes.BAD_REQUEST, "No session found");
  }

  return result;
};

export const AuthService = {
  registerUser,
  loginUser,
  verifyEmail,
  refreshToken,
  forgotPassword,
  verifyForgotPasswordOTP,
  resetPassword,
  getAllSessions,
  changePassword,
  resendOtp,
  logoutUser,
  logoutAllDevice,
  logoutSingleDevice,
};
