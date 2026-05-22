import { Request, Response } from "express";
import ApiResponse from "../../utils/ApiResponse";
import catchAsync from "../../utils/catchAsync";
import { AuthService } from "./auth.service";
import AppError from "../../utils/AppError";
import { StatusCodes } from "http-status-codes";
import { UAParser } from "ua-parser-js";

const register = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthService.registerUser(req.body);
  ApiResponse.success(res, result, "User registered successfully");
});

const verifyEmail = catchAsync(async (req: Request, res: Response) => {
  const { email, otp } = req.body;
  const result = await AuthService.verifyEmail({ email, otp });
  ApiResponse.success(res, result, "Email verified successfully");
});

const refreshToken = catchAsync(async (req: Request, res: Response) => {
  const isProduction = process.env.NODE_ENV === "production";
  const refreshToken = req.cookies.refreshToken;
  const { newAccessToken, newRefreshToken } =
    await AuthService.refreshToken(refreshToken);

  res.cookie("accessToken", newAccessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "strict",
    maxAge: 1000 * 60 * 15,
  });

  res.cookie("refreshToken", newRefreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "strict",
    maxAge: 1000 * 60 * 60 * 24 * 7,
  });

  ApiResponse.success(
    res,
    null,
    "Access and refresh tokens generated successfully",
  );
});

const resendOtp = catchAsync(async (req: Request, res: Response) => {
  const { email } = req.body;
  const result = await AuthService.resendOtp(email);
  ApiResponse.success(res, result, "OTP sent successfully");
});

const changePassword = catchAsync(async (req: Request, res: Response) => {
  const isProduction = process.env.NODE_ENV === "production";

  const refreshToken = req.cookies.refreshToken;
  const userId = req.user?.userId;

  if (!userId) {
    throw new AppError(StatusCodes.UNAUTHORIZED, "Unauthorized");
  }

  const { newAccessToken, newRefreshToken } = await AuthService.changePassword(
    userId,
    req.body,
    refreshToken,
  );

  res.cookie("accessToken", newAccessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "strict",
    maxAge: 1000 * 60 * 15,
  });

  res.cookie("refreshToken", newRefreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "strict",
    maxAge: 1000 * 60 * 60 * 24 * 7,
  });

  ApiResponse.success(
    res,
    { newAccessToken, newRefreshToken },
    "Password changed successfully",
  );
});

const forgotPassword = catchAsync(async (req: Request, res: Response) => {
  const { email } = req.body;
  const result = await AuthService.forgotPassword(email);
  ApiResponse.success(res, result, "Reset token sent to email successfully");
});

const verifyForgotPasswordOTP = catchAsync(
  async (req: Request, res: Response) => {
    const { email, otp } = req.body;
    const result = await AuthService.verifyForgotPasswordOTP({ email, otp });
    ApiResponse.success(res, result, "OTP verified successfully");
  },
);

const resetPassword = catchAsync(async (req: Request, res: Response) => {
  const resetToken = req.params.resetToken as string;
  const { newPassword, confirmNewPassword } = req.body;

  if (!resetToken) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Reset token is required");
  }

  if (newPassword !== confirmNewPassword) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "New password and confirm password do not match",
    );
  }

  const result = await AuthService.resetPassword(resetToken, newPassword);
  ApiResponse.success(res, result, "Password reset successfully");
});

const login = catchAsync(async (req: Request, res: Response) => {
  const userAgent = req.headers["user-agent"];
  const parser = new UAParser(userAgent);
  const sessionInfo = parser.getResult();

  const isProduction = process.env.NODE_ENV === "production";
  const result = await AuthService.loginUser(
    req.body,
    sessionInfo,
    req.ip as string,
  );

  if (result.requiresTwoFactor) {
    return ApiResponse.success(
      res,
      result,
      "Two-factor authentication required",
    );
  }

  res.cookie("accessToken", result.accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "strict",
    maxAge: 1000 * 60 * 15,
  });

  res.cookie("refreshToken", result.refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "strict",
    maxAge: 1000 * 60 * 60 * 24 * 7,
  });

  ApiResponse.success(res, result, "User logged in successfully");
});

const verifyTwoFactor = catchAsync(async (req: Request, res: Response) => {
  const { token, otp } = req.body;
  const result = await AuthService.verifyTwoFactor(token, otp);

  res.cookie("accessToken", result.accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 1000 * 60 * 15,
  });

  res.cookie("refreshToken", result.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 1000 * 60 * 60 * 24 * 7,
  });

  ApiResponse.success(
    res,
    result,
    "Two-factor authentication verified successfully",
  );
});

const getAllSessions = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    throw new AppError(StatusCodes.UNAUTHORIZED, "Unauthorized");
  }
  const result = await AuthService.getAllSessions(userId);
  ApiResponse.success(res, result, "Sessions retrieved successfully");
});

const logout = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  const refreshToken = req.cookies.refreshToken;

  if (!userId) {
    throw new AppError(StatusCodes.UNAUTHORIZED, "Unauthorized");
  }
  if (!refreshToken) {
    throw new AppError(StatusCodes.UNAUTHORIZED, "Unauthorized");
  }

  const result = await AuthService.logoutUser(userId, refreshToken);

  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");

  ApiResponse.success(res, result, "User logged out successfully");
});

const logoutSingleSession = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  const sessionId = req.params.sessionId as string;

  if (!userId) {
    throw new AppError(StatusCodes.UNAUTHORIZED, "Unauthorized");
  }

  if (!sessionId) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Session ID is required");
  }

  const result = await AuthService.logoutSingleDevice(userId, sessionId);
  ApiResponse.success(res, result, "Session logged out successfully");
});

const logoutAllDevices = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    throw new AppError(StatusCodes.UNAUTHORIZED, "Unauthorized");
  }

  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");
  const result = await AuthService.logoutAllDevice(userId);
  ApiResponse.success(res, result, "User logged out successfully");
});

// user part
const getAllUsers = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthService.getAllUsers();
  ApiResponse.success(res, result, "Users retrieved successfully");
});

const getUser = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    throw new AppError(StatusCodes.UNAUTHORIZED, "Unauthorized");
  }
  const result = await AuthService.getUser(userId);
  ApiResponse.success(res, result, "User retrieved successfully");
});

const deleteUserAccount = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    throw new AppError(StatusCodes.UNAUTHORIZED, "Unauthorized");
  }
  const result = await AuthService.deleteUserAccount(userId);
  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");
  ApiResponse.success(res, result, "User account deleted successfully");
});

export const AuthController = {
  register,
  login,
  verifyEmail,
  refreshToken,
  forgotPassword,
  verifyForgotPasswordOTP,
  resetPassword,
  changePassword,
  getAllSessions,
  resendOtp,
  logout,
  logoutAllDevices,
  logoutSingleSession,
  // user relatedg
  getAllUsers,
  getUser,
  deleteUserAccount,
  verifyTwoFactor,
};
