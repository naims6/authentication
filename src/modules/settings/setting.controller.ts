import catchAsync from "../../utils/catchAsync";
import { Request, Response } from "express";
import { SettingServices } from "./setting.service";
import ApiResponse from "../../utils/ApiResponse";

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
