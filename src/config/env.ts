const config = {
    node_env: process.env.NODE_ENV as string || "development",
    database_url: process.env.DATABASE_URL as string,
    port: process.env.PORT as string || "5000",
    jwt_secret: process.env.JWT_SECRET as string,
    jwt_expires_in: process.env.JWT_EXPIRES_IN as string,
}

export default config;