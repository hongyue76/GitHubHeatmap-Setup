const axios = require('axios');
const cache = require('./cacheService');
const { logger, cacheLogger, apiLogger } = require('../config/logger');

class GitHubService {
  constructor(token = null) {
    this.token = token;
    this.baseURL = 'https://api.github.com';
    this.headers = {
      'Accept': 'application/vnd.github.v3+json',
    };
    
    if (token) {
      this.headers['Authorization'] = `token ${token}`;
    }
  }

  /**
   * 获取用户基本信息（带缓存）
   */
  async getUserProfile(username) {
    const cacheKey = `user:profile:${username}`;
    
    // 尝试从缓存获取
    const cached = await cache.get(cacheKey);
    if (cached) {
      cacheLogger.hit(`user:profile:${username}`, 'User Profile');
      return cached;
    }
    
    cacheLogger.miss(`user:profile:${username}`, 'User Profile');
    
    try {
      const response = await axios.get(`${this.baseURL}/users/${username}`, {
        headers: this.headers
      });
      
      // 写入缓存（5 分钟）
      await cache.set(cacheKey, response.data, 300);
      
      return response.data;
    } catch (error) {
      throw new Error(`获取用户信息失败: ${error.response?.status === 404 ? '用户不存在' : error.message}`);
    }
  }

  /**
   * 获取用户贡献数据（过去一年的提交记录）（带缓存）
   */
  async getContributions(username) {
    const cacheKey = `user:contributions:${username}`;
    
    // 尝试从缓存获取
    const cached = await cache.get(cacheKey);
    if (cached) {
      cacheLogger.hit(`user:contributions:${username}`, 'Contributions');
      return cached;
    }
    
    cacheLogger.miss(`user:contributions:${username}`, 'Contributions');
    
    try {
      // 使用GitHub GraphQL API获取更详细的贡献数据
      const query = `
        query($username: String!) {
          user(login: $username) {
            contributionsCollection {
              contributionCalendar {
                totalContributions
                weeks {
                  contributionDays {
                    date
                    contributionCount
                    contributionLevel
                  }
                }
              }
            }
          }
        }
      `;

      const response = await axios.post(
        'https://api.github.com/graphql',
        { query, variables: { username } },
        { headers: this.headers }
      );

      if (response.data.errors) {
        throw new Error(response.data.errors[0].message);
      }

      const calendar = response.data.data.user.contributionsCollection.contributionCalendar;
      
      // 转换数据格式
      const contributions = [];
      calendar.weeks.forEach(week => {
        week.contributionDays.forEach(day => {
          contributions.push({
            date: day.date,
            count: day.contributionCount,
            level: day.contributionLevel
          });
        });
      });

      const result = {
        totalContributions: calendar.totalContributions,
        contributions: contributions
      };
      
      // 写入缓存（10 分钟）
      await cache.set(cacheKey, result, 600);
      
      return result;
    } catch (error) {
      // 如果GraphQL失败，降级使用REST API
      return await this.getContributionsFallback(username);
    }
  }

  /**
   * 降级方案：使用REST API获取提交数据
   */
  async getContributionsFallback(username) {
    try {
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      
      const since = oneYearAgo.toISOString();
      
      // 获取用户的提交记录
      const response = await axios.get(
        `${this.baseURL}/search/commits`,
        {
          headers: this.headers,
          params: {
            q: `author:${username} committer-date:>=${since.split('T')[0]}`,
            sort: 'committer-date',
            order: 'desc',
            per_page: 100
          }
        }
      );

      const commits = response.data.items || [];
      
      // 按日期聚合
      const contributionsMap = {};
      commits.forEach(commit => {
        const date = commit.commit.committer.date.split('T')[0];
        if (!contributionsMap[date]) {
          contributionsMap[date] = 0;
        }
        contributionsMap[date]++;
      });

      // 转换为数组格式
      const contributions = Object.entries(contributionsMap).map(([date, count]) => ({
        date,
        count,
        level: this.getContributionLevel(count)
      }));

      return {
        totalContributions: contributions.reduce((sum, c) => sum + c.count, 0),
        contributions: contributions.sort((a, b) => a.date.localeCompare(b.date))
      };
    } catch (error) {
      throw new Error(`获取贡献数据失败: ${error.message}`);
    }
  }

  /**
   * 获取用户仓库列表及语言统计（带缓存）
   */
  async getUserRepos(username) {
    const cacheKey = `user:repos:${username}`;
    
    // 尝试从缓存获取
    const cached = await cache.get(cacheKey);
    if (cached) {
      cacheLogger.hit(`user:repos:${username}`, 'Repos');
      return cached;
    }
    
    cacheLogger.miss(`user:repos:${username}`, 'Repos');
    
    try {
      const response = await axios.get(
        `${this.baseURL}/users/${username}/repos`,
        {
          headers: this.headers,
          params: {
            type: 'owner',
            sort: 'updated',
            per_page: 100
          }
        }
      );

      const repos = response.data;
      
      // 获取每个仓库的语言统计
      const repoDetails = await Promise.all(
        repos.map(async (repo) => {
          try {
            const languagesResponse = await axios.get(
              `${this.baseURL}/repos/${username}/${repo.name}/languages`,
              { headers: this.headers }
            );
            
            return {
              name: repo.name,
              description: repo.description,
              stars: repo.stargazers_count,
              forks: repo.forks_count,
              updatedAt: repo.updated_at,
              languages: languagesResponse.data
            };
          } catch (error) {
            return {
              name: repo.name,
              description: repo.description,
              stars: repo.stars,
              forks: repo.forks,
              updatedAt: repo.updated_at,
              languages: {}
            };
          }
        })
      );

      // 写入缓存（10 分钟）
      await cache.set(cacheKey, repoDetails, 600);
      
      return repoDetails;
    } catch (error) {
      throw new Error(`获取仓库列表失败: ${error.message}`);
    }
  }

  /**
   * 根据提交数量确定贡献级别
   */
  getContributionLevel(count) {
    if (count === 0) return 'NONE';
    if (count <= 3) return 'FIRST_QUARTILE';
    if (count <= 6) return 'SECOND_QUARTILE';
    if (count <= 9) return 'THIRD_QUARTILE';
    return 'FOURTH_QUARTILE';
  }
}

module.exports = GitHubService;
