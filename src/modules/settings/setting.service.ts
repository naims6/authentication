import { prisma } from "../../lib/prisma";

const toggleTwoFactor = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  if (!user) {
    throw new Error("User not found");
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
