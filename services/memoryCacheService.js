/**
 * 内存缓存服务（Redis 替代方案）
 * 用于开发环境或无 Redis 服务的情况
 */

class MemoryCacheService {
  constructor() {
    this.cache = new Map();
    this.ttls = new Map(); // 存储过期时间
    
    // 定期清理过期缓存
    setInterval(() => {
      this.cleanupExpired();
    }, 60000); // 每分钟清理一次
  }

  /**
   * 获取缓存
   */
  async get(key) {
    if (!this.cache.has(key)) {
      return null;
    }

    // 检查是否过期
    const expiry = this.ttls.get(key);
    if (expiry && Date.now() > expiry) {
      this.delete(key);
      return null;
    }

    const data = this.cache.get(key);
    try {
      return JSON.parse(data);
    } catch {
      return data;
    }
  }

  /**
   * 设置缓存
   */
  async set(key, value, ttl = 300) {
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);
    this.cache.set(key, serialized);
    
    // 设置过期时间（毫秒）
    const expiryTime = Date.now() + (ttl * 1000);
    this.ttls.set(key, expiryTime);
  }

  /**
   * 删除缓存
   */
  async delete(key) {
    this.cache.delete(key);
    this.ttls.delete(key);
  }

  /**
   * 批量删除匹配模式的缓存
   */
  async invalidatePattern(pattern) {
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.delete(key);
      }
    }
  }

  /**
   * 检查缓存是否存在
   */
  async exists(key) {
    if (!this.cache.has(key)) {
      return false;
    }

    const expiry = this.ttls.get(key);
    if (expiry && Date.now() > expiry) {
      this.delete(key);
      return false;
    }

    return true;
  }

  /**
   * 清理过期缓存
   */
  cleanupExpired() {
    const now = Date.now();
    for (const [key, expiry] of this.ttls.entries()) {
      if (now > expiry) {
        this.cache.delete(key);
        this.ttls.delete(key);
      }
    }
  }

  /**
   * 获取缓存统计
   */
  async getInfo() {
    return {
      connected: true,
      size: this.cache.size,
      type: 'memory'
    };
  }
}

// 导出单例
module.exports = new MemoryCacheService();
