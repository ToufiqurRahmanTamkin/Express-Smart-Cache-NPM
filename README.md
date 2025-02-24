# Express Smart Cache

A lightweight caching middleware for Express with support for in-memory and Redis-based caching.

## 🚀 Features
- **In-Memory & Redis Support** – Choose between fast local caching or scalable Redis-based caching.
- **TTL (Time-To-Live) Support** – Define how long responses stay cached.
- **Automatic Cache Invalidation** – Cache expires after the defined TTL.
- **Easy Integration** – Works with any Express.js API.

---

## 📦 Installation
```sh
npm install express-smart-cache
```
```
import express from "express";
import CacheMiddleware from "express-smart-cache";

const app = express();
const cache = new CacheMiddleware({ ttl: 60 }); // Cache for 60 seconds

app.use(cache.middleware());

app.get("/data", (req, res) => {
res.json({ message: "Hello, World!", timestamp: new Date() });
});

app.listen(3000, () => console.log("Server running on port 3000"));
```
# 🚀 API Middleware Options

Configure the API middleware behavior with the following options:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| ttl | Number | `60` sec | Time-to-live for cached responses |
| redis | Boolean | `false` | Enable Redis-based caching |
| redisHost | String | `"127.0.0.1"` | Redis server host |
| redisPort | Number | `6379` | Redis server port |

## ❌ Clearing Cache

To manually clear the cache for a specific route:

```javascript
cache.clearCache("/data");
```