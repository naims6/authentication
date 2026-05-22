import { Router } from "express";
import { SettingController } from "./setting.controller";
import isAuthenticated from "../../middleware/authenticate";

const router: Router = Router();

router.use(isAuthenticated);

router.patch("/toggle-two-factor", SettingController.toggleTwoFactor);

export const settingRoutes = router;
