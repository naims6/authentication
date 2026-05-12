import { Router } from "express";
import { AuthController } from "./auth.controller";
import validateRequest from "../../middleware/validateRequest";
import {
  ChangePasswordSchema,
  EmailVerifySchema,
  ResendOtpSchema,
  UserCreateSchema,
  UserLoginSchema,
} from "./auth.validation";
import isAuthenticated from "../../middleware/authenticate";

const router: Router = Router();

// register
router.post(
  "/register",
  validateRequest(UserCreateSchema),
  AuthController.register,
);

// refresh token
router.post("/refresh-token", isAuthenticated, AuthController.refreshToken);

// verify email
router.post(
  "/verify-email",
  validateRequest(EmailVerifySchema),
  AuthController.verifyEmail,
);

// login
router.post("/login", validateRequest(UserLoginSchema), AuthController.login);

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

// logout from all devices
router.post(
  "/logout-all-devices",
  isAuthenticated,
  AuthController.logoutAllDevices,
);

export const AuthRoutes = router;
