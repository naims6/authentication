import catchAsync from "../../utils/catchAsync.js";
import { Request, Response } from "express";
import { SettingServices } from "./setting.service.js";
import ApiResponse from "../../utils/ApiResponse.js";

const toggleTwoFactor = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    throw new Error("User not found");
  }

  const result = await SettingServices.toggleTwoFactor(userId);

  const isTwoFactorEnabled = result.isTwoFactorEnabled;

  ApiResponse.success(
    res,
    result,
    `${isTwoFactorEnabled ? "Enabled" : "Disabled"} two factor authentication`,
  );
});

export const SettingController = {
  toggleTwoFactor,
};
