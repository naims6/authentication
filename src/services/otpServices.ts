import { redisClient } from "../config/redis";

type OTPScope = "email_verification" | "password_reset";
const otpKey = (scope: OTPScope, userId: string) => `otp:${scope}:${userId}`;


const saveOTP = async (scope: OTPScope, userId: string, hashedOTP: string) => {
  return await redisClient.set(otpKey(scope, userId), hashedOTP, { EX: 300 });
};

const getOTP = async (scope: OTPScope, userId: string) => {
  return await redisClient.get(otpKey(scope, userId));
};

const deleteOTP = async (scope: OTPScope, userId: string) => {
  return await redisClient.del(otpKey(scope, userId));
};

export const OTPServices = {
  saveOTP,
  getOTP,
  deleteOTP,
};