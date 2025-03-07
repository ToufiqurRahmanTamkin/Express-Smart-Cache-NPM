# Express Smart Cache

A lightweight, flexible caching middleware for Express with support for in-memory and Redis-based caching.

## 🚀 Features
- **In-Memory & Redis Support** – Choose between fast local caching or scalable Redis-based caching
- **Flexible Caching Strategies** – Customize cache key generation, route exclusions, and method filtering
- **TTL (Time-To-Live) Support** – Define how long responses stay cached
- **Automatic Cache Invalidation** – Cache expires after the defined TTL
- **Metrics and Logging** – Optional performance tracking and error logging
- **Easy Integration** – Works seamlessly with any Express.js API

## 📦 Installation
```sh
npm install express-smart-cache
```

## 🔧 Basic Usage

### Simple In-Memory Caching
```javascript
const express = require('express');
const CacheMiddleware = require('express-smart-cache');

const app = express();
const cache = new CacheMiddleware({ ttl: 60 }); // Cache for 60 seconds

app.use(cache.middleware());

app.get("/users", (req, res) => {
  res.json({ 
    users: [
      { id: 1, name: "John Doe" },
      { id: 2, name: "Jane Smith" }
    ]
  });
});

app.listen(3000, () => console.log("Server running on port 3000"));
```

### Redis Caching
```javascript
const express = require('express');
const CacheMiddleware = require('express-smart-cache');

const app = express();
const cache = new CacheMiddleware({
  redis: true,
  redisHost: "your-redis-host",
  redisPort: 6379,
  ttl: 120 // Cache for 2 minutes
});

app.use(cache.middleware());

app.get("/products", (req, res) => {
  res.json({ 
    products: [
      { id: 1, name: "Laptop", price: 999 },
      { id: 2, name: "Smartphone", price: 599 }
    ]
  });
});

app.listen(3000, () => console.log("Server running on port 3000"));
```

## 🛠 Advanced Configuration

### Comprehensive Options
```javascript
const cache = new CacheMiddleware({
  // Caching Options
  ttl: 300, // 5 minutes cache duration
  redis: true, // Enable Redis
  redisHost: "127.0.0.1",
  redisPort: 6379,

  // Advanced Features
  excludeRoutes: ['/admin', '/login'], // Routes to skip caching
  allowedMethods: ['GET', 'HEAD'], // Only cache these methods
  cacheControl: true, // Add HTTP cache-control headers
  metrics: true, // Enable performance tracking
  logging: true, // Enable error logging

  // Custom Key Generation
  keyGenerator: (req) => {
    // Custom cache key logic
    return `custom-${req.originalUrl}:${req.method}`;
  }
});
```

### Manually Invalidating Cache
```javascript
// Clear cache for a specific route
cache.invalidateCache("/users");

// Get current cache metrics
const metrics = cache.getMetrics();
console.log(metrics);
// Outputs: { hits: 10, misses: 5, size: 3 }
```

## 🚢 API Middleware Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `ttl` | Number | `60` sec | Time-to-live for cached responses |
| `redis` | Boolean | `false` | Enable Redis-based caching |
| `redisHost` | String | `"127.0.0.1"` | Redis server host |
| `redisPort` | Number | `6379` | Redis server port |
| `excludeRoutes` | Array | `[]` | Routes to exclude from caching |
| `allowedMethods` | Array | `['GET']` | HTTP methods to cache |
| `cacheControl` | Boolean | `false` | Add HTTP cache headers |
| `metrics` | Boolean | `false` | Track cache performance |
| `logging` | Boolean | `false` | Enable error logging |
