import bcrypt from "bcrypt";

export const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000);
};

export const hashOTP = (otp: number) => {
  return bcrypt.hash(otp.toString(), 10);
};
