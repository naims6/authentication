import { redisClient } from "../config/redis";

const saveOTP = async (userId: string, hashedOTP: string) => {
  return await redisClient.set(`otp:${userId}`, hashedOTP, { EX: 300 });
};

const getOTP = async (userId: string) => {
  return await redisClient.get(`otp:${userId}`);
};

const deleteOTP = async (userId: string) => {
  return await redisClient.del(`otp:${userId}`);
};

export const OTPServices = {
  saveOTP,
  getOTP,
  deleteOTP,
};
