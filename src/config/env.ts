import "dotenv/config";



const config = {
  node_env: (process.env.NODE_ENV as string) || "development",
  database_url: process.env.DATABASE_URL as string,
  port: (process.env.PORT as string) || "5000",
  // JWT configuration
  jwt_access_secret: process.env.JWT_ACCESS_SECRET as string,
  jwt_refresh_secret: process.env.JWT_REFRESH_SECRET as string,

  // email configuration
  email_host: process.env.EMAIL_HOST as string,
  email_user: process.env.EMAIL_USER as string,
  email_pass: process.env.EMAIL_PASS as string,
} as const;

export default config;
