const express = require('express');
const router = express.Router();

// 导出热力图
router.get('/heatmap/:username', (req, res) => {
  res.json({ success: true, message: 'Export heatmap' });
});

// 导出语言分布
router.get('/languages/:username', (req, res) => {
  res.json({ success: true, message: 'Export languages' });
});

// 导出分享卡片
router.get('/share-card/:username', (req, res) => {
  res.json({ success: true, message: 'Export share card' });
});

// 批量导出
router.post('/batch/:username', (req, res) => {
  res.json({ success: true, message: 'Batch export' });
});

module.exports = router;
