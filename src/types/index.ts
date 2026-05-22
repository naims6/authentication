export interface ErrorResponse {
  success: boolean;
  message: string;
  stack?: string;
  error?: any;
}

export interface JwtPayload {
  userId: string;
  email: string;
}

export interface RefreshTokenPayload {
  userId: string;
  email: string;
  sessionId: string;
}

export interface RateLimiterOptions {
  windowMs?: number;
  max?: number;
  message?: string;
  prefix: string;
}