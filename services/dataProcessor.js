class DataProcessor {
  /**
   * 处理贡献数据，按语言和项目分类
   */
  processContributions(contributions, repos) {
    // 按日期组织贡献数据
    const contributionMap = {};
    contributions.forEach(c => {
      contributionMap[c.date] = c.count;
    });

    // 统计各语言的贡献
    const languageStats = this.calculateLanguageStats(repos);
    
    // 按项目统计贡献
    const projectStats = this.calculateProjectStats(repos);

    return {
      contributionMap,
      languageStats,
      projectStats,
      totalContributions: contributions.reduce((sum, c) => sum + c.count, 0)
    };
  }

  /**
   * 计算语言统计数据
   */
  calculateLanguageStats(repos) {
    const languageMap = {};
    
    repos.forEach(repo => {
      Object.entries(repo.languages).forEach(([lang, bytes]) => {
        if (!languageMap[lang]) {
          languageMap[lang] = {
            name: lang,
            bytes: 0,
            repos: []
          };
        }
        languageMap[lang].bytes += bytes;
        languageMap[lang].repos.push(repo.name);
      });
    });

    // 转换为数组并排序
    const languages = Object.values(languageMap)
      .sort((a, b) => b.bytes - a.bytes)
      .slice(0, 10); // 取前10种语言

    // 计算总字节数用于百分比
    const totalBytes = languages.reduce((sum, lang) => sum + lang.bytes, 0);
    
    return languages.map(lang => ({
      ...lang,
      percentage: totalBytes > 0 ? ((lang.bytes / totalBytes) * 100).toFixed(1) : 0
    }));
  }

  /**
   * 计算项目统计数据
   */
  calculateProjectStats(repos) {
    return repos
      .filter(repo => Object.keys(repo.languages).length > 0)
      .map(repo => {
        const primaryLang = Object.keys(repo.languages)[0];
        return {
          name: repo.name,
          description: repo.description || 'No description',
          stars: repo.stars,
          forks: repo.forks,
          primaryLanguage: primaryLang,
          updatedAt: repo.updatedAt
        };
      })
      .sort((a, b) => b.stars - a.stars)
      .slice(0, 10); // 取前10个项目
  }

  /**
   * 生成热力图数据结构
   */
  generateHeatmapData(contributions) {
    // 找出最早和最晚的日期
    const dates = contributions.map(c => new Date(c.date));
    const minDate = new Date(Math.min(...dates));
    const maxDate = new Date(Math.max(...dates));

    // 创建完整的日期范围（填补空白）
    const heatmapData = [];
    const currentDate = new Date(minDate);
    
    while (currentDate <= maxDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const contribution = contributions.find(c => c.date === dateStr);
      
      heatmapData.push({
        date: dateStr,
        count: contribution ? contribution.count : 0,
        level: contribution ? contribution.level : 'NONE'
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return heatmapData;
  }

  /**
   * 获取颜色映射
   */
  getColorScheme(type = 'default') {
    const schemes = {
      default: {
        NONE: '#ebedf0',
        FIRST_QUARTILE: '#9be9a8',
        SECOND_QUARTILE: '#40c463',
        THIRD_QUARTILE: '#30a14e',
        FOURTH_QUARTILE: '#216e39'
      },
      blue: {
        NONE: '#ebedf0',
        FIRST_QUARTILE: '#9ecbff',
        SECOND_QUARTILE: '#54aeff',
        THIRD_QUARTILE: '#0969da',
        FOURTH_QUARTILE: '#0a3069'
      },
      purple: {
        NONE: '#ebedf0',
        FIRST_QUARTILE: '#d8b4fe',
        SECOND_QUARTILE: '#c084fc',
        THIRD_QUARTILE: '#a855f7',
        FOURTH_QUARTILE: '#7e22ce'
      },
      orange: {
        NONE: '#ebedf0',
        FIRST_QUARTILE: '#fed7aa',
        SECOND_QUARTILE: '#fdba74',
        THIRD_QUARTILE: '#fb923c',
        FOURTH_QUARTILE: '#ea580c'
      }
    };

    return schemes[type] || schemes.default;
  }

  /**
   * 根据语言获取颜色
   */
  getLanguageColor(language) {
    const colors = {
      'JavaScript': '#f1e05a',
      'TypeScript': '#2b7489',
      'Python': '#3572A5',
      'Java': '#b07219',
      'Go': '#00ADD8',
      'Rust': '#dea584',
      'C++': '#f34b7d',
      'C': '#555555',
      'HTML': '#e34c26',
      'CSS': '#563d7c',
      'PHP': '#4F5D95',
      'Ruby': '#701516',
      'Swift': '#ffac45',
      'Kotlin': '#A97BFF',
      'Shell': '#89e051',
      'Vue': '#41b883',
      'React': '#61dafb',
      'Angular': '#dd0031'
    };

    return colors[language] || '#808080';
  }
}

module.exports = DataProcessor;
