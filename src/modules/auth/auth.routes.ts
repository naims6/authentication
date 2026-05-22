import { Router } from "express";
import { AuthController } from "./auth.controller";
import validateRequest from "../../middleware/validateRequest";
import {
  ChangePasswordSchema,
  EmailSchema,
  EmailVerifySchema,
  ResendOtpSchema,
  ResetPasswordSchema,
  UserCreateSchema,
  UserLoginSchema,
} from "./auth.validation";
import isAuthenticated from "../../middleware/authenticate";
import { rateLimiters } from "../../middleware/rateLimiter";

const router: Router = Router();

// register
router.post(
  "/register",
  rateLimiters.register,
  validateRequest(UserCreateSchema),
  AuthController.register,
);

// refresh token
router.post("/refresh-token", AuthController.refreshToken);

// verify email
router.post(
  "/verify-email",
  rateLimiters.otp,
  validateRequest(EmailVerifySchema),
  AuthController.verifyEmail,
);

router.post(
  "/forgot-password",
  rateLimiters.forgotPassword,
  validateRequest(EmailSchema),
  AuthController.forgotPassword,
);

router.post(
  "/verify-forgot-password-otp",
  validateRequest(EmailVerifySchema),
  AuthController.verifyForgotPasswordOTP,
);

router.post(
  "/reset-password/:resetToken",
  validateRequest(ResetPasswordSchema),
  AuthController.resetPassword,
);

// login
router.post(
  "/login",
  rateLimiters.login,
  validateRequest(UserLoginSchema),
  AuthController.login,
);

// get all sessions
router.get("/sessions", isAuthenticated, AuthController.getAllSessions);

// resend otp
router.post(
  "/resend-otp",
  validateRequest(ResendOtpSchema),
  AuthController.resendOtp,
);

// change password
router.post(
  "/change-password",
  validateRequest(ChangePasswordSchema),
  isAuthenticated,
  AuthController.changePassword,
);

// logout
router.post("/logout", isAuthenticated, AuthController.logout);

router.delete(
  "/sessions/:sessionId",
  isAuthenticated,
  AuthController.logoutSingleSession,
);

// logout from all devices
router.post(
  "/logout-all-devices",
  isAuthenticated,
  AuthController.logoutAllDevices,
);

// User related routes
// delete user account
router.delete(
  "/delete-account",
  isAuthenticated,
  AuthController.deleteUserAccount,
);

// get user
router.get("/me", isAuthenticated, AuthController.getUser);

// get all users
router.get("/all-users", isAuthenticated, AuthController.getAllUsers);

export const AuthRoutes = router;
