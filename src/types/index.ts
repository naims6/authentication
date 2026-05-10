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
  sessionId: string;
}
