import { prisma } from "../../lib/prisma";
import { hashPassword } from "../../utils/hashPassword";
import { generateOTP } from "../../utils/otp";
import { sendVerificationEmail } from "../../utils/sendVerificationEmail";
import { UserCreate, UserLogin } from "./auth.validation";

const registerUser = async (payload: UserCreate) => {
  const { email, password, fullName } = payload;
  const hashedPassword = await hashPassword(password);
  const otp = generateOTP();
  const hashedOTP = await hashPassword(otp.toString());

  const user = await prisma.user.findUnique({ where: { email } });

  if (user) {
    throw new Error("Email already in use");
  }

  const result = await prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: {
        email,
        password: hashedPassword,
        fullName,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        isVerified: true,
      },
    });

    await tx.oTP.create({
      data: {
        userId: newUser.id,
        code: hashedOTP,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      },
    });

    return newUser;
  });

  await sendVerificationEmail(result.email, result.fullName, otp);

  return result;
};

const verifyEmail = async (email: string, otp: string) => {};

const loginUser = (payload: UserLogin) => {
  return payload;
};

export const AuthService = {
  registerUser,
  loginUser,
};
