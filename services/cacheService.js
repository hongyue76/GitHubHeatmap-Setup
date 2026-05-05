const Redis = require('ioredis');

/**
 * Redis 缓存服务（带内存缓存降级）
 * 用于缓存 GitHub API 响应和生成的 SVG
 */

class CacheService {
  constructor() {
    this.useRedis = false;
    this.memoryCache = null;
    
    // 从环境变量获取 Redis 配置
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    
    try {
      this.redis = new Redis(redisUrl, {
        // 连接选项
        maxRetriesPerRequest: 3,
        retryStrategy(times) {
          if (times > 3) {
            console.log('[Redis] Max retries reached, falling back to memory cache');
            return null; // 停止重试，使用内存缓存
          }
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
        // 自动重连
        enableAutoPipelining: true,
      });

      // 监听连接成功
      this.redis.on('connect', () => {
        console.log('[Redis] Connected successfully');
        this.useRedis = true;
      });

      // 监听错误
      this.redis.on('error', (error) => {
        console.error('[Redis] Connection error:', error.message);
        if (!this.useRedis && !this.memoryCache) {
          console.log('[Redis] Falling back to memory cache');
          this.memoryCache = require('./memoryCacheService');
        }
      });

      // 默认 TTL（秒）
      this.TTL = {
        USER_PROFILE: 300,        // 用户信息: 5 分钟
        CONTRIBUTIONS: 600,       // 贡献数据: 10 分钟
        REPOS: 600,               // 仓库列表: 10 分钟
        SVG_HEATMAP: 1800,        // 热力图 SVG: 30 分钟
        SVG_LANGUAGE: 1800,       // 语言图 SVG: 30 分钟
        SVG_SHARE_CARD: 1800,     // 分享卡片 SVG: 30 分钟
      };
    } catch (error) {
      console.log('[Redis] Failed to initialize, using memory cache');
      this.memoryCache = require('./memoryCacheService');
    }
  }

  /**
   * 获取缓存
   * @param {string} key - 缓存键
   * @returns {Promise<any>} 缓存的数据，不存在则返回 null
   */
  async get(key) {
    try {
      if (this.useRedis) {
        const data = await this.redis.get(key);
        if (!data) {
          return null;
        }
        
        // 尝试解析 JSON
        try {
          return JSON.parse(data);
        } catch {
          // 如果不是 JSON，直接返回字符串（如 SVG）
          return data;
        }
      } else if (this.memoryCache) {
        return await this.memoryCache.get(key);
      }
      return null;
    } catch (error) {
      console.error(`[Cache] GET error for key ${key}:`, error.message);
      return null;
    }
  }

  /**
   * 设置缓存
   * @param {string} key - 缓存键
   * @param {any} value - 缓存的值
   * @param {number} ttl - 过期时间（秒），使用默认值如果未提供
   */
  async set(key, value, ttl = null) {
    try {
      // 自动推断 TTL
      if (!ttl) {
        ttl = this._inferTTL(key);
      }

      if (this.useRedis) {
        // 序列化值
        const serialized = typeof value === 'string' ? value : JSON.stringify(value);
        await this.redis.setex(key, ttl, serialized);
      } else if (this.memoryCache) {
        await this.memoryCache.set(key, value, ttl);
      }
    } catch (error) {
      console.error(`[Cache] SET error for key ${key}:`, error.message);
    }
  }

  /**
   * 删除缓存
   * @param {string} key - 缓存键
   */
  async delete(key) {
    try {
      if (this.useRedis) {
        await this.redis.del(key);
      } else if (this.memoryCache) {
        await this.memoryCache.delete(key);
      }
    } catch (error) {
      console.error(`[Cache] DELETE error for key ${key}:`, error.message);
    }
  }

  /**
   * 批量删除匹配模式的缓存
   * @param {string} pattern - 匹配模式（支持通配符 *）
   * @example invalidatePattern('user:profile:*')
   */
  async invalidatePattern(pattern) {
    try {
      if (this.useRedis) {
        const keys = await this.redis.keys(pattern);
        if (keys.length > 0) {
          await this.redis.del(...keys);
          console.log(`[Cache] Invalidated ${keys.length} keys matching "${pattern}"`);
        }
      } else if (this.memoryCache) {
        await this.memoryCache.invalidatePattern(pattern);
      }
    } catch (error) {
      console.error(`[Cache] INVALIDATE error for pattern ${pattern}:`, error.message);
    }
  }

  /**
   * 检查缓存是否存在
   * @param {string} key - 缓存键
   * @returns {Promise<boolean>}
   */
  async exists(key) {
    try {
      if (this.useRedis) {
        const result = await this.redis.exists(key);
        return result === 1;
      } else if (this.memoryCache) {
        return await this.memoryCache.exists(key);
      }
      return false;
    } catch (error) {
      console.error(`[Cache] EXISTS error for key ${key}:`, error.message);
      return false;
    }
  }

  /**
   * 获取缓存统计信息
   * @returns {Promise<Object>}
   */
  async getInfo() {
    try {
      if (this.useRedis) {
        const info = await this.redis.info();
        const dbSize = await this.redis.dbsize();
        
        return {
          connected: true,
          type: 'redis',
          dbSize,
          info: this._parseInfo(info),
        };
      } else if (this.memoryCache) {
        const memInfo = await this.memoryCache.getInfo();
        return {
          connected: true,
          type: 'memory',
          size: memInfo.size,
        };
      }
      return {
        connected: false,
        error: 'No cache backend available',
      };
    } catch (error) {
      return {
        connected: false,
        error: error.message,
      };
    }
  }

  /**
   * 关闭连接
   */
  async disconnect() {
    try {
      await this.redis.quit();
      console.log('[Redis] Disconnected');
    } catch (error) {
      console.error('[Redis] Disconnect error:', error.message);
    }
  }

  /**
   * 根据键名推断 TTL
   * @private
   */
  _inferTTL(key) {
    if (key.includes('user:profile')) return this.TTL.USER_PROFILE;
    if (key.includes('contributions')) return this.TTL.CONTRIBUTIONS;
    if (key.includes('repos')) return this.TTL.REPOS;
    if (key.includes('heatmap')) return this.TTL.SVG_HEATMAP;
    if (key.includes('language')) return this.TTL.SVG_LANGUAGE;
    if (key.includes('share-card')) return this.TTL.SVG_SHARE_CARD;
    
    // 默认 5 分钟
    return 300;
  }

  /**
   * 解析 Redis INFO 输出
   * @private
   */
  _parseInfo(infoString) {
    const info = {};
    const lines = infoString.split('\r\n');
    
    lines.forEach(line => {
      if (line.includes(':')) {
        const [key, value] = line.split(':');
        info[key] = value;
      }
    });
    
    return info;
  }
}

// 导出单例
module.exports = new CacheService();
