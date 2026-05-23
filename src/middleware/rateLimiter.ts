import { createRateLimiter } from "../utils/createRateLimit.js";

const loginRateLimiter = createRateLimiter({
  prefix: "login:",
  max: 5,
  message: "Too many login attempts",
});

const otpRateLimiter = createRateLimiter({
  prefix: "otp:",
  windowMs: 5 * 60 * 1000,
  max: 3,
  message: "Too many OTP requests",
});

const registerRateLimiter = createRateLimiter({
  prefix: "register:",
  max: 3,
  message: "Too many registration attempts",
});

const forgotPasswordRateLimiter = createRateLimiter({
  prefix: "forgot-password:",
  max: 3,
  message: "Too many password reset attempts",
});

const globalRateLimiter = createRateLimiter({
  prefix: "global:",
  max: 100,
});

export const rateLimiters = {
  login: loginRateLimiter,
  otp: otpRateLimiter,
  register: registerRateLimiter,
  forgotPassword: forgotPasswordRateLimiter,
  global: globalRateLimiter,
};
