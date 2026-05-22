import rateLimit, { RateLimitRequestHandler } from "express-rate-limit";

import RedisStore from "rate-limit-redis";
import { redisClient } from "../config/redis";
import { RateLimiterOptions } from "../types";

export const createRateLimiter = ({
  windowMs = 15 * 60 * 1000,
  max = 5,
  message = "Too many requests, please try again later.",
  prefix,
}: RateLimiterOptions): RateLimitRequestHandler => {
  return rateLimit({
    windowMs,
    max,

    standardHeaders: true,
    legacyHeaders: false,

    message: {
      success: false,
      message,
    },

    store: new RedisStore({
      prefix,
      sendCommand: (...args: string[]) => redisClient.sendCommand(args),
    }),
  });
};
