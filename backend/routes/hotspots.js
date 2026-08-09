const express = require('express');
const { findHotspots } = require('../services/hotspotFinder');

const router = express.Router();

router.post('/', (req, res) => {
  const { businessType, lat, lng, scope } = req.body || {};

  if (typeof businessType !== 'string' || businessType.trim().length === 0) {
    return res.status(400).json({ error: 'businessType must be a non-empty string' });
  }

  // Optional center point for a "local" scope scan.
  const latNum = Number(lat);
  const lngNum = Number(lng);
  const hasPoint = Number.isFinite(latNum) && Number.isFinite(lngNum);

  if (scope === 'local' && !hasPoint) {
    return res
      .status(400)
      .json({ error: 'local scope requires lat and lng' });
  }
  if (hasPoint && (latNum < -90 || latNum > 90 || lngNum < -180 || lngNum > 180)) {
    return res.status(400).json({ error: 'lat/lng out of range' });
  }

  const result = findHotspots({
    businessType: businessType.trim(),
    lat: hasPoint ? latNum : undefined,
    lng: hasPoint ? lngNum : undefined,
    scope: scope === 'local' || scope === 'city' ? scope : undefined,
  });

  res.json(result);
});

module.exports = router;
