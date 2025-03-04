import { createClient } from "ioredis";
import crypto from 'crypto';

class CacheMiddleware {
  constructor(options = {}) {
    // Cache Configuration
    this.config = {
      redis: options.redis || false,
      ttl: options.ttl || 60,
      redisHost: options.redisHost || "127.0.0.1",
      redisPort: options.redisPort || 6379,

      // New advanced configuration options
      cacheControl: options.cacheControl || false,
      excludeRoutes: options.excludeRoutes || [],
      allowedMethods: options.allowedMethods || ['GET'],
      keyGenerator: options.keyGenerator || this.defaultKeyGenerator,
      compression: options.compression || false,
      metrics: options.metrics || false,
      logging: options.logging || false
    };

    // Cache Storage
    this.memoryCache = new Map();
    this.metrics = {
      hits: 0,
      misses: 0,
      size: 0
    };

    // Redis Client Setup
    if (this.config.redis) {
      this.redisClient = createClient({
        host: this.config.redisHost,
        port: this.config.redisPort
      });
      this.redisClient.on("error", this.handleError.bind(this));
    }
  }

  // Default Cache Key Generator
  defaultKeyGenerator(req) {
    const baseKey = req.originalUrl;
    const methodKey = req.method.toLowerCase();

    return crypto
      .createHash('md5')
      .update(`${baseKey}:${methodKey}`)
      .digest('hex');
  }

  // Error Handling with Optional Logging
  handleError(err) {
    if (this.config.logging) {
      console.error('Cache Middleware Error:', err);
    }
  }

  // Compression Utility (Basic Implementation)
  compress(data) {
    return this.config.compression
      ? JSON.stringify(data)
      : data;
  }

  decompress(data) {
    return this.config.compression
      ? JSON.parse(data)
      : data;
  }

  // Cache Access Methods
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

      // Update Metrics
      if (this.config.metrics) {
        this.metrics.size = this.memoryCache.size;
      }
    } catch (error) {
      this.handleError(error);
    }
  }

  // Cache Invalidation
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

  // Middleware Core Function
  middleware() {
    return async (req, res, next) => {
      // Route Exclusion Check
      if (this.config.excludeRoutes.includes(req.path)) {
        return next();
      }

      // Method Filtering
      if (!this.config.allowedMethods.includes(req.method)) {
        return next();
      }

      const cacheKey = this.config.keyGenerator(req);

      // Check Cached Response
      const cachedData = await this.getCache(cacheKey);
      if (cachedData) {
        // Update Hit Metrics
        if (this.config.metrics) {
          this.metrics.hits++;
        }

        // Optional Cache-Control Headers
        if (this.config.cacheControl) {
          res.set('Cache-Control', `public, max-age=${this.config.ttl}`);
        }

        return res.json({
          fromCache: true,
          data: cachedData,
          metrics: this.config.metrics ? this.metrics : undefined
        });
      }

      // Miss Metrics
      if (this.config.metrics) {
        this.metrics.misses++;
      }

      // Wrap Original JSON Method
      const originalJson = res.json.bind(res);
      res.json = async (data) => {
        await this.setCache(cacheKey, data, this.config.ttl);
        originalJson(data);
      };

      next();
    };
  }

  // Metrics and Performance Tracking
  getMetrics() {
    return this.config.metrics ? this.metrics : null;
  }
}

export default CacheMiddleware;