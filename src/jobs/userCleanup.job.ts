import { prisma } from "../lib/prisma.js";

export const permanentDeleteUser = async () => {
  try {
    const deletedUser = await prisma.user.deleteMany({
      where: {
        status: "DELETED",
        deleteAfter: {
          lte: new Date(),
        },
      },
    });
    console.log("Successfully deleted", deletedUser.count, "users");
    return deletedUser;
  } catch (error) {
    console.log("Failed to delete users:", error);
    throw error;
  }
};
