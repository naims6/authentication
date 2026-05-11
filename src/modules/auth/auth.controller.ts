import { Request, Response } from "express";
import ApiResponse from "../../utils/ApiResponse";
import catchAsync from "../../utils/catchAsync";
import { AuthService } from "./auth.service";
import AppError from "../../utils/AppError";
import { StatusCodes } from "http-status-codes";

const register = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthService.registerUser(req.body);
  ApiResponse.success(res, result, "User registered successfully");
});

const verifyEmail = catchAsync(async (req: Request, res: Response) => {
  const { email, otp } = req.body;
  const result = await AuthService.verifyEmail({ email, otp });
  ApiResponse.success(res, result, "Email verified successfully");
});

const resendOtp = catchAsync(async (req: Request, res: Response) => {
  const { email } = req.body;
  const result = await AuthService.resendOtp(email);
  ApiResponse.success(res, result, "OTP sent successfully");
});

const login = catchAsync(async (req: Request, res: Response) => {
  const isProduction = process.env.NODE_ENV === "production";
  const { accessToken, refreshToken } = await AuthService.loginUser(req.body);

  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "strict",
    maxAge: 1000 * 60 * 15,
  });

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "strict",
    maxAge: 1000 * 60 * 60 * 24 * 7,
  });

  ApiResponse.success(
    res,
    { accessToken, refreshToken },
    "User logged in successfully",
  );
});

const logout = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  const refreshToken = req.cookies.refreshToken;
  console.log(userId, refreshToken);

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

export const AuthController = {
  register,
  login,
  verifyEmail,
  resendOtp,
  logout,
  logoutAllDevices,
};
