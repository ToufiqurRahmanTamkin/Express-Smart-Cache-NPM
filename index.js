import { createClient } from "ioredis";

class CacheMiddleware {
  constructor(options = {}) {
    this.redisEnabled = options.redis || false;
    this.ttl = options.ttl || 60; // Default TTL 60 seconds
    this.memoryCache = new Map();

    if (this.redisEnabled) {
      this.redisClient = createClient({ host: options.redisHost || "127.0.0.1", port: options.redisPort || 6379 });
      this.redisClient.on("error", (err) => console.error("Redis Error:", err));
    }
  }

  async getCache(key) {
    if (this.redisEnabled) {
      return await this.redisClient.get(key);
    }
    return this.memoryCache.get(key);
  }

  async setCache(key, value, ttl) {
    if (this.redisEnabled) {
      await this.redisClient.setex(key, ttl, JSON.stringify(value));
    } else {
      this.memoryCache.set(key, value);
      setTimeout(() => this.memoryCache.delete(key), ttl * 1000);
    }
  }

  middleware() {
    return async (req, res, next) => {
      const cacheKey = req.originalUrl;

      const cachedData = await this.getCache(cacheKey);
      if (cachedData) {
        return res.json({ fromCache: true, data: JSON.parse(cachedData) });
      }

      const originalJson = res.json.bind(res);
      res.json = async (data) => {
        await this.setCache(cacheKey, data, this.ttl);
        originalJson(data);
      };

      next();
    };
  }
}

export default CacheMiddleware;
