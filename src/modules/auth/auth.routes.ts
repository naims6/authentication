import { Router } from "express";
import { AuthController } from "./auth.controller";
import validateRequest from "../../middleware/validateRequest";
import { UserCreateSchema, UserLoginSchema } from "./auth.validation";

const router: Router = Router();

router.post(
  "/register",
  validateRequest(UserCreateSchema),
  AuthController.register,
);

router.post("/login", validateRequest(UserLoginSchema), AuthController.login);

export const AuthRoutes = router;
