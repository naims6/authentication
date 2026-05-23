import { StatusCodes } from "http-status-codes";
import { prisma } from "../../lib/prisma.js";
import AppError from "../../utils/AppError.js";

const toggleTwoFactor = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  if (!user) {
    throw new AppError(StatusCodes.UNAUTHORIZED, "User not found");
  }

  // Get current two-factor status
  const isTwoFactorEnabled = user.isTwoFactorEnabled;

  // Update the user
  const updatedUser = await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      isTwoFactorEnabled: !isTwoFactorEnabled,
    },
    select: {
      isTwoFactorEnabled: true,
    },
  });

  return updatedUser;
};

export const SettingServices = {
  toggleTwoFactor,
};
