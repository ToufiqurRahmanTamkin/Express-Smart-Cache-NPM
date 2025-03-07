import Redis from 'ioredis';
import crypto from 'crypto';

class CacheMiddleware {
  constructor(options = {}) {
    this.config = {
      redis: options.redis || false,
      ttl: options.ttl || 60,
      redisHost: options.redisHost || "127.0.0.1",
      redisPort: options.redisPort || 6379,
      cacheControl: options.cacheControl || false,
      excludeRoutes: options.excludeRoutes || [],
      allowedMethods: options.allowedMethods || ['GET'],
      keyGenerator: options.keyGenerator || this.defaultKeyGenerator,
      compression: options.compression || false,
      metrics: options.metrics || false,
      logging: options.logging || false
    };

    this.memoryCache = new Map();
    this.metrics = {
      hits: 0,
      misses: 0,
      size: 0
    };

    if (this.config.redis) {
      this.redisClient = new Redis({
        host: this.config.redisHost,
        port: this.config.redisPort
      });
      this.redisClient.on("error", this.handleError.bind(this));
    }
  }

  defaultKeyGenerator(req) {
    const baseKey = req.originalUrl;
    const methodKey = req.method.toLowerCase();

    return crypto
      .createHash('md5')
      .update(`${baseKey}:${methodKey}`)
      .digest('hex');
  }

  handleError(err) {
    if (this.config.logging) {
      console.error('Cache Middleware Error:', err);
    }
  }

  compress(data) {
    return this.config.compression ? JSON.stringify(data) : data;
  }

  decompress(data) {
    return this.config.compression ? JSON.parse(data) : data;
  }

  async getCache(key) {
    try {
      if (this.config.redis) {
        const cachedValue = await this.redisClient.get(key);
        return cachedValue ? this.decompress(cachedValue) : null;
      }
      return this.memoryCache.get(key);
    } catch (error) {
      this.handleError(error);
      return null;
    }
  }

  async setCache(key, value, ttl) {
    try {
      const compressedValue = this.compress(value);

      if (this.config.redis) {
        await this.redisClient.setex(key, ttl, compressedValue);
      } else {
        this.memoryCache.set(key, compressedValue);
        setTimeout(() => this.memoryCache.delete(key), ttl * 1000);
      }

      if (this.config.metrics) {
        this.metrics.size = this.memoryCache.size;
      }
    } catch (error) {
      this.handleError(error);
    }
  }

  async invalidateCache(key) {
    try {
      if (this.config.redis) {
        await this.redisClient.del(key);
      } else {
        this.memoryCache.delete(key);
      }
    } catch (error) {
      this.handleError(error);
    }
  }

  middleware() {
    return async (req, res, next) => {
      if (this.config.excludeRoutes.includes(req.path)) {
        return next();
      }

      if (!this.config.allowedMethods.includes(req.method)) {
        return next();
      }

      const cacheKey = this.config.keyGenerator(req);

      const cachedData = await this.getCache(cacheKey);
      if (cachedData) {
        if (this.config.metrics) {
          this.metrics.hits++;
        }

        if (this.config.cacheControl) {
          res.set('Cache-Control', `public, max-age=${this.config.ttl}`);
        }

        return res.json({
          fromCache: true,
          data: cachedData,
          metrics: this.config.metrics ? this.metrics : undefined
        });
      }

      if (this.config.metrics) {
        this.metrics.misses++;
      }

      const originalJson = res.json.bind(res);
      res.json = async (data) => {
        await this.setCache(cacheKey, data, this.config.ttl);
        originalJson(data);
      };

      next();
    };
  }

  getMetrics() {
    return this.config.metrics ? this.metrics : null;
  }
}

export default CacheMiddleware;
module.exports = CacheMiddleware;