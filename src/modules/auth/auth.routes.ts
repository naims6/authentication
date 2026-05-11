import { Router } from "express";
import { AuthController } from "./auth.controller";
import validateRequest from "../../middleware/validateRequest";
import {
  EmailVerifySchema,
  ResendOtpSchema,
  UserCreateSchema,
  UserLoginSchema,
} from "./auth.validation";
import isAuthenticated from "../../middleware/authenticate";

const router: Router = Router();

router.post(
  "/register",
  validateRequest(UserCreateSchema),
  AuthController.register,
);

router.post(
  "/verify-email",
  validateRequest(EmailVerifySchema),
  AuthController.verifyEmail,
);

router.post("/login", validateRequest(UserLoginSchema), AuthController.login);

router.post(
  "/resend-otp",
  validateRequest(ResendOtpSchema),
  AuthController.resendOtp,
);

router.post("/logout", isAuthenticated, AuthController.logout);

router.post(
  "/logout-all-devices",
  isAuthenticated,
  AuthController.logoutAllDevices,
);

export const AuthRoutes = router;
