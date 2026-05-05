const DataProcessor = require('../services/dataProcessor');

describe('DataProcessor', () => {
  let processor;

  beforeEach(() => {
    processor = new DataProcessor();
  });

  describe('generateHeatmapData', () => {
    it('应该正确生成热力图数据', () => {
      const contributions = [
        { date: '2026-01-01', count: 5, level: 'FIRST_QUARTILE' },
        { date: '2026-01-02', count: 10, level: 'SECOND_QUARTILE' }
      ];

      const heatmapData = processor.generateHeatmapData(contributions);
      
      expect(heatmapData).toBeInstanceOf(Array);
      expect(heatmapData.length).toBeGreaterThan(0);
      expect(heatmapData[0]).toHaveProperty('date');
      expect(heatmapData[0]).toHaveProperty('count');
      expect(heatmapData[0]).toHaveProperty('level');
    });

    it('应该处理空数据', () => {
      const heatmapData = processor.generateHeatmapData([]);
      expect(heatmapData).toBeInstanceOf(Array);
    });
  });

  describe('calculateLanguageStats', () => {
    it('应该正确计算语言统计', () => {
      const repos = [
        {
          name: 'repo1',
          languages: { JavaScript: 1000, Python: 500 }
        },
        {
          name: 'repo2',
          languages: { JavaScript: 2000, Go: 1000 }
        }
      ];

      const stats = processor.calculateLanguageStats(repos);
      
      expect(stats).toBeInstanceOf(Array);
      expect(stats.length).toBeGreaterThan(0);
      expect(stats[0]).toHaveProperty('name');
      expect(stats[0]).toHaveProperty('bytes');
      expect(stats[0]).toHaveProperty('percentage');
    });

    it('应该按字节数排序', () => {
      const repos = [
        {
          name: 'repo1',
          languages: { Python: 1000, JavaScript: 2000 }
        }
      ];

      const stats = processor.calculateLanguageStats(repos);
      
      // JavaScript 应该排在前面（字节数更多）
      expect(stats[0].name).toBe('JavaScript');
    });
  });

  describe('processContributions', () => {
    it('应该正确处理贡献数据', () => {
      const contributions = [
        { date: '2026-01-01', count: 5 }
      ];
      const repos = [
        { name: 'repo1', languages: { JavaScript: 1000 } }
      ];

      const result = processor.processContributions(contributions, repos);
      
      expect(result).toHaveProperty('languageStats');
      expect(result).toHaveProperty('projectStats');
    });
  });
});
