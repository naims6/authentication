import { prisma } from "../lib/prisma";


export const permanentDeleteUser = async () => {
  const deletedUser = await prisma.user.deleteMany({
    where: {
      status: "DELETED",
      deleteAfter: {
        lte: new Date(),
      },
    },
  });

  return deletedUser;
};
