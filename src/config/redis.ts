import { createClient, RedisClientType } from "redis";
import config from "./env";

const redis_url = config.redis_url;

if (!redis_url) {
  throw new Error("Missing required environment variable: REDIS_URL");
}

const redisClient: RedisClientType = createClient({
  url: redis_url,
});

redisClient.on("error", (err) => console.log("Redis Client Error", err));
redisClient.on("connect", () => console.log("Redis Connected successfully"));

const connectRedis = async () => {
  try {
    if (!redisClient.isOpen) {
      await redisClient.connect();
    }
  } catch (error) {
    console.error("Redis Client Error", error);
    throw error;
  }
};

export { redisClient };
export default connectRedis;
