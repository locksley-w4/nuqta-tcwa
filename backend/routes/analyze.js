const express = require('express');
const { analyzeBusiness } = require('../services/analyzer');
const { validateAnalyzeInput } = require('../utils/validators');

const router = express.Router();

router.post('/', (req, res) => {
  const { businessType, lat, lng } = req.body || {};

  const validation = validateAnalyzeInput({ businessType, lat, lng });
  if (!validation.valid) {
    return res.status(400).json({ error: validation.message });
  }

  const result = analyzeBusiness({
    businessType: businessType.trim(),
    lat: Number(lat),
    lng: Number(lng),
  });

  res.json(result);
});

module.exports = router;
