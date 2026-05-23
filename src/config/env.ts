import "dotenv/config";



const config = {
  node_env: (process.env.NODE_ENV as string) || "development",
  database_url: process.env.DATABASE_URL as string,
  port: (process.env.PORT as string) || "5000",
  // JWT configuration
  jwt_access_secret: process.env.JWT_ACCESS_SECRET as string,
  jwt_refresh_secret: process.env.JWT_REFRESH_SECRET as string,
  jwt_reset_secret: process.env.JWT_RESET_SECRET as string,
  jwt_two_factor_secret: process.env.JWT_TWO_FACTOR_SECRET as string,
  
  // redis configuration
  redis_url: process.env.REDIS_URL as string,
  
  // resend email configuration
  resend_api_key: process.env.RESEND_API_KEY as string,
} as const;

export default config;
