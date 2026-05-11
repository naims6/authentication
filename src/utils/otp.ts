import bcrypt from "bcrypt";
import { randomInt } from "crypto";

export const generateOTP = () => {
  return randomInt(0, 1_000_000).toString().padStart(6, "0");
};

export const hashOTP = (otp: string) => {
  return bcrypt.hash(otp, 10);
};

export const verifyOTP = (otp: string, hashedOTP: string) => {
  return bcrypt.compare(otp, hashedOTP);
};
