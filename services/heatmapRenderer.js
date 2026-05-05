class HeatmapRenderer {
  constructor() {
    this.cellSize = 12;
    this.cellGap = 2;
    this.monthLabelHeight = 20;
    this.weekdayLabelWidth = 30;
    this.padding = 20;
  }

  /**
   * 渲染贡献热力图为 SVG
   */
  renderHeatmap(heatmapData, colorScheme = 'default', options = {}) {
    const {
      width = 800,
      height = 200,
      showLabels = true,
      title = null
    } = options;

    // 获取颜色方案
    const colors = this.getColorScheme(colorScheme);

    // 计算网格尺寸
    const cellSize = this.cellSize;
    const cellGap = this.cellGap;
    
    const startX = showLabels ? this.weekdayLabelWidth + this.padding : this.padding;
    const startY = showLabels ? this.monthLabelHeight + this.padding : this.padding;

    // 将数据按周组织
    const weeks = this.organizeByWeeks(heatmapData);

    let svg = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    svg += `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">\n`;
    svg += `<rect width="${width}" height="${height}" fill="#ffffff"/>\n`;

    // 绘制标题
    if (title && showLabels) {
      svg += `<text x="${this.padding}" y="15" font-family="Arial" font-size="16" font-weight="bold" fill="#24292e">${this.escapeXml(title)}</text>\n`;
    }

    // 绘制月份标签
    if (showLabels) {
      svg += this.drawMonthLabelsSVG(weeks, startX, startY, cellSize, cellGap);
    }

    // 绘制星期标签
    if (showLabels) {
      svg += this.drawWeekdayLabelsSVG(startX, startY, cellSize, cellGap);
    }

    // 绘制贡献格子
    svg += this.drawCellsSVG(weeks, startX, startY, cellSize, cellGap, colors);

    // 绘制图例
    if (showLabels) {
      svg += this.drawLegendSVG(colors, width - this.padding - 200, height - 30);
    }

    svg += `</svg>`;
    return svg;
  }

  /**
   * 将数据按周组织
   */
  organizeByWeeks(heatmapData) {
    const weeks = [];
    let currentWeek = [];

    heatmapData.forEach((data, index) => {
      currentWeek.push(data);
      
      // 每7天为一周，或者是一周的最后一天（周日）
      if (currentWeek.length === 7 || index === heatmapData.length - 1) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    });

    return weeks;
  }

  /**
   * 绘制月份标签 SVG
   */
  drawMonthLabelsSVG(weeks, startX, startY, cellSize, cellGap) {
    let svg = '';
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    let lastMonth = -1;
    
    weeks.forEach((week, weekIndex) => {
      if (week.length > 0) {
        const date = new Date(week[0].date);
        const month = date.getMonth();
        
        if (month !== lastMonth) {
          const x = startX + weekIndex * (cellSize + cellGap);
          svg += `<text x="${x}" y="${startY - 5}" font-family="Arial" font-size="10" fill="#586069">${months[month]}</text>\n`;
          lastMonth = month;
        }
      }
    });
    
    return svg;
  }

  /**
   * 绘制星期标签 SVG
   */
  drawWeekdayLabelsSVG(startX, startY, cellSize, cellGap) {
    let svg = '';
    const weekdays = ['Mon', '', 'Wed', '', 'Fri', ''];
    
    weekdays.forEach((day, index) => {
      if (day) {
        const y = startY + index * (cellSize + cellGap) + cellSize / 2 + 3;
        svg += `<text x="${startX - 5}" y="${y}" font-family="Arial" font-size="10" fill="#586069" text-anchor="end">${day}</text>\n`;
      }
    });
    
    return svg;
  }

  /**
   * 绘制贡献格子 SVG
   */
  drawCellsSVG(weeks, startX, startY, cellSize, cellGap, colors) {
    let svg = '';
    
    weeks.forEach((week, weekIndex) => {
      week.forEach((day, dayIndex) => {
        const x = startX + weekIndex * (cellSize + cellGap);
        const y = startY + dayIndex * (cellSize + cellGap);

        // 获取颜色
        const color = colors[day.level] || colors.NONE;
        
        // 绘制圆角矩形
        svg += `<rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" rx="2" ry="2" fill="${color}"/>\n`;
      });
    });
    
    return svg;
  }

  /**
   * 绘制图例 SVG
   */
  drawLegendSVG(colors, x, y) {
    let svg = '';
    
    svg += `<text x="${x - 40}" y="${y + 6}" font-family="Arial" font-size="10" fill="#586069">Less</text>\n`;

    const levels = ['NONE', 'FIRST_QUARTILE', 'SECOND_QUARTILE', 
                    'THIRD_QUARTILE', 'FOURTH_QUARTILE'];
    
    levels.forEach((level, index) => {
      const boxX = x + index * 15;
      svg += `<rect x="${boxX}" y="${y}" width="12" height="12" fill="${colors[level]}"/>\n`;
    });

    svg += `<text x="${x + levels.length * 15 + 5}" y="${y + 6}" font-family="Arial" font-size="10" fill="#586069">More</text>\n`;
    
    return svg;
  }

  /**
   * 生成语言分布图 SVG
   */
  renderLanguageChart(languageStats, width = 400, height = 300) {
    let svg = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    svg += `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">\n`;
    svg += `<rect width="${width}" height="${height}" fill="#ffffff"/>\n`;

    // 标题
    svg += `<text x="${width / 2}" y="25" font-family="Arial" font-size="16" font-weight="bold" fill="#24292e" text-anchor="middle">Top Languages</text>\n`;

    // 绘制条形图
    const barHeight = 25;
    const barGap = 10;
    const startY = 50;
    const maxBarWidth = width - 150;

    const maxBytes = Math.max(...languageStats.map(l => l.bytes));

    languageStats.forEach((lang, index) => {
      const y = startY + index * (barHeight + barGap);
      const barWidth = (lang.bytes / maxBytes) * maxBarWidth;

      // 语言名称
      svg += `<text x="10" y="${y + 17}" font-family="Arial" font-size="12" fill="#24292e">${this.escapeXml(lang.name)}</text>\n`;

      // 进度条
      const color = this.getLanguageColor(lang.name);
      svg += `<rect x="100" y="${y}" width="${barWidth}" height="${barHeight}" fill="${color}" rx="3" ry="3"/>\n`;

      // 百分比
      svg += `<text x="${width - 10}" y="${y + 17}" font-family="Arial" font-size="11" fill="#586069" text-anchor="end">${lang.percentage}%</text>\n`;
    });

    svg += `</svg>`;
    return svg;
  }

  /**
   * 生成分享卡片 SVG
   */
  renderShareCard(username, userProfile, totalContributions, languageStats, colorScheme = 'default') {
    const width = 600;
    const height = 400;
    
    let svg = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    svg += `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">\n`;
    
    // 渐变背景
    svg += `<defs>\n`;
    svg += `  <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">\n`;
    svg += `    <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />\n`;
    svg += `    <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />\n`;
    svg += `  </linearGradient>\n`;
    svg += `</defs>\n`;
    svg += `<rect width="${width}" height="${height}" fill="url(#bgGradient)"/>\n`;

    // 白色卡片区域
    svg += `<rect x="20" y="20" width="${width - 40}" height="${height - 40}" rx="15" ry="15" fill="#ffffff"/>\n`;

    // 用户信息
    svg += `<text x="${width / 2}" y="70" font-family="Arial" font-size="24" font-weight="bold" fill="#24292e" text-anchor="middle">@${this.escapeXml(username)}</text>\n`;

    if (userProfile.name) {
      svg += `<text x="${width / 2}" y="95" font-family="Arial" font-size="16" fill="#586069" text-anchor="middle">${this.escapeXml(userProfile.name)}</text>\n`;
    }

    // 总贡献数
    svg += `<text x="${width / 2}" y="160" font-family="Arial" font-size="48" font-weight="bold" fill="#24292e" text-anchor="middle">${totalContributions}</text>\n`;
    svg += `<text x="${width / 2}" y="185" font-family="Arial" font-size="14" fill="#586069" text-anchor="middle">Total Contributions</text>\n`;

    // 顶部语言
    if (languageStats.length > 0) {
      svg += `<text x="${width / 2}" y="220" font-family="Arial" font-size="12" fill="#586069" text-anchor="middle">Top Language: ${this.escapeXml(languageStats[0].name)}</text>\n`;

      // 语言颜色指示器
      const langColor = this.getLanguageColor(languageStats[0].name);
      svg += `<circle cx="${width / 2 - 60}" cy="217" r="6" fill="${langColor}"/>\n`;
    }

    // 底部装饰
    svg += `<rect x="20" y="${height - 60}" width="${width - 40}" height="40" fill="#f6f8fa"/>\n`;
    svg += `<text x="${width / 2}" y="${height - 35}" font-family="Arial" font-size="11" fill="#586069" text-anchor="middle">Generated by GitHub Contribution Heatmap</text>\n`;

    svg += `</svg>`;
    return svg;
  }

  /**
   * 获取颜色方案
   */
  getColorScheme(type) {
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

  /**
   * XML 转义，防止 XSS
   */
  escapeXml(text) {
    if (!text) return '';
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}

module.exports = HeatmapRenderer;
