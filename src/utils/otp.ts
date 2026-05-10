import bcrypt from "bcrypt";

export const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const hashOTP = (otp: string) => {
  return bcrypt.hash(otp, 10);
};

export const verifyOTP = (otp: string, hashedOTP: string) => {
  return bcrypt.compare(otp, hashedOTP);
};
