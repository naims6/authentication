import { createClient, RedisClientType } from "redis";
import config from "./env";

const redisClient: RedisClientType = createClient({
  url: config.redis_url,
});

redisClient.on("error", (err) => console.log("Redis Client Error", err));
redisClient.on("connect", () => console.log("Redis Connected successfully"));

const connectRedis = async () => {
  try {
    await redisClient.connect();
  } catch (error) {
    console.log("Redis Client Error", error);
  }
};

export { redisClient };
export default connectRedis;
