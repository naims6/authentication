export interface ErrorResponse {
  success: boolean;
  message: string;
  stack?: string;
  error?: any;
}
