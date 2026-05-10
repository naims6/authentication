import { Router } from "express";
import { AuthController } from "./auth.controller";
import validateRequest from "../../middleware/validateRequest";
import {
  EmailVerifySchema,
  UserCreateSchema,
  UserLoginSchema,
} from "./auth.validation";

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

export const AuthRoutes = router;
