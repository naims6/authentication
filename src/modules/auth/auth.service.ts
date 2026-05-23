import { StatusCodes } from "http-status-codes";
import { prisma } from "../../lib/prisma.js";
import AppError from "../../utils/AppError.js";
import { hashPassword, verifyPassword } from "../../utils/hashPassword.js";
import { generateOTP, hashOTP, verifyOTP } from "../../utils/otp.js";
import { sendVerificationEmail } from "../../utils/sendVerificationEmail.js";
import {
  ChangePassword,
  EmailVerify,
  LoginMetadata,
  UserCreate,
  UserLogin,
} from "./auth.validation.js";
import { JwtPayload } from "../../types/index.js";
import {
  createAccessToken,
  createRefreshToken,
  createTempLoginToken,
  generateSessionId,
  verifyRefreshToken,
  verifyTempLoginToken,
} from "./auth.helper.js";
import { IResult } from "ua-parser-js";
import { OTPServices } from "../../services/otpServices.js";
import { redisClient } from "../../config/redis.js";

const registerUser = async (payload: UserCreate) => {
  const { email, password, fullName } = payload;

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new AppError(StatusCodes.BAD_REQUEST, "User already exists");
  }

  const hashedPassword = await hashPassword(password);
  const otp = generateOTP();
  const hashedOTP = await hashOTP(otp);

  // Create user
  const newUser = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      fullName,
    },
    select: { id: true, email: true, fullName: true, isVerified: true },
  });

  try {
    // Save OTP to Redis
    await OTPServices.saveOTP("email_verification", newUser.id, hashedOTP);
    // Send verification email
    await sendVerificationEmail(newUser.email, newUser.fullName, otp);
  } catch {
    await prisma.user.delete({
      where: { id: newUser.id },
    });
    throw new AppError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      "Failed to send verification email",
    );
  }

  return newUser;
};

const verifyEmail = async (payload: EmailVerify) => {
  const { email, otp } = payload;
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      fullName: true,
      isVerified: true,
      status: true,
    },
  });

  if (!user) {
    throw new AppError(StatusCodes.BAD_REQUEST, "User not found");
  }

  const otpRecord = await OTPServices.getOTP("email_verification", user.id);

  if (!otpRecord) {
    throw new AppError(StatusCodes.BAD_REQUEST, "OTP not found");
  }

  const isOTPValid = await verifyOTP(otp, otpRecord);

  if (!isOTPValid) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Wrong OTP");
  }

  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: { isVerified: true },
    select: { id: true, email: true, fullName: true, isVerified: true },
  });

  await OTPServices.deleteOTP("email_verification", user.id);

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

  // save otp
  const otpRecord = await OTPServices.saveOTP(
    "password_reset",
    user.id,
    hashedOTP,
  );
  // send email
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

  const otpRecord = await OTPServices.getOTP("password_reset", user.id);

  if (!otpRecord) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Invalid OTP");
  }

  const isOTPValid = await verifyOTP(otp, otpRecord);

  if (!isOTPValid) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Wrong OTP");
  }

  const resetToken = crypto.randomUUID();

  await redisClient.set(`reset:${resetToken}`, user.id, {
    EX: 300,
  });

  await OTPServices.deleteOTP("password_reset", user.id);

  return { resetToken };
};

const resetPassword = async (resetToken: string, newPassword: string) => {
  const userId = await redisClient.get(`reset:${resetToken}`);

  if (!userId) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Invalid reset token");
  }

  const hashedPassword = await hashPassword(newPassword);

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
    select: { id: true, email: true, fullName: true, isVerified: true },
  });

  await redisClient.del(`reset:${resetToken}`);

  await prisma.session.deleteMany({
    where: { userId: userId },
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

  const otpRecord = await OTPServices.saveOTP(
    "email_verification",
    user.id,
    hashedOTP,
  );

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
      status: true,
      isTwoFactorEnabled: true,
    },
  });

  if (!user) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Invalid email or password");
  }

  if (user.status === "DELETED") {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "Your account has been deleted",
    );
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

  // Two-factor authentication
  if (user.isTwoFactorEnabled) {
    const otp = generateOTP();

    const hashedOtp = await hashOTP(otp);

    await OTPServices.saveOTP("two_factor", user.id, hashedOtp);

    const loginChallengeToken = createTempLoginToken({
      userId: user.id,
      email: user.email,
    });

    await redisClient.set(
      `login_challenge:${user.id}`,
      JSON.stringify({
        ip,
        deviceInfo: `${deviceName} - ${browserName}`,
      }),
      {
        EX: 60 * 5,
      },
    );

    await sendVerificationEmail(user.email, user.fullName, otp);

    return {
      requiresTwoFactor: true,
      loginChallengeToken,
    };
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

  await prisma.session.create({
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

const verifyTwoFactor = async (token: string, otp: string) => {
  const decodedToken = verifyTempLoginToken(token);

  if (!decodedToken) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Invalid token");
  }

  const user = await prisma.user.findUnique({
    where: { id: decodedToken.userId },
  });

  if (!user) {
    throw new AppError(StatusCodes.BAD_REQUEST, "User not found");
  }

  if (user.status === "DELETED" || !user.isVerified) {
    throw new AppError(
      StatusCodes.UNAUTHORIZED,
      "Login challenge is no longer valid",
    );
  }

  const otpRecord = await OTPServices.getOTP("two_factor", user.id);

  if (!otpRecord) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Invalid OTP");
  }

  const isOtpValid = await verifyOTP(otp, otpRecord);

  if (!isOtpValid) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Invalid OTP");
  }

  await OTPServices.deleteOTP("two_factor", user.id);

  // get login metadata from redis
  const metadata = await redisClient.get(`login_challenge:${user.id}`);

  if (!metadata) {
    throw new AppError(StatusCodes.UNAUTHORIZED, "Login session expired");
  }

  const parsedMetaData = JSON.parse(metadata) as LoginMetadata;

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
      ipAddress: parsedMetaData.ip,
      deviceInfo: parsedMetaData.deviceInfo,
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

// User Part
const getAllUsers = async () => {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      fullName: true,
      email: true,
      createdAt: true,
      status: true,
      isVerified: true,
    },
  });

  if (users.length === 0) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Users not found");
  }
  return users;
};

const getUser = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      fullName: true,
      email: true,
      createdAt: true,
    },
  });

  if (!user) {
    throw new AppError(StatusCodes.BAD_REQUEST, "User not found");
  }
  return user;
};

// Delete account
const deleteUserAccount = async (userId: string) => {
  if (!userId) {
    throw new AppError(StatusCodes.BAD_REQUEST, "User ID is required");
  }

  // TODO: Use Transaction
  const deletedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      status: "DELETED",
      deletedAt: new Date(),
      deleteAfter: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
    select: { id: true, fullName: true, deletedAt: true },
  });

  await prisma.session.deleteMany({
    where: { userId },
  });

  return deletedUser;
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
  // user related
  getAllUsers,
  getUser,
  deleteUserAccount,
  verifyTwoFactor,
};
