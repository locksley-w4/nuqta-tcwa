function validateAnalyzeInput({ businessType, lat, lng }) {
  if (typeof businessType !== 'string' || businessType.trim().length === 0) {
    return { valid: false, message: 'businessType must be a non-empty string' };
  }

  const latNum = Number(lat);
  const lngNum = Number(lng);

  if (!Number.isFinite(latNum) || latNum < -90 || latNum > 90) {
    return { valid: false, message: 'lat must be a number between -90 and 90' };
  }

  if (!Number.isFinite(lngNum) || lngNum < -180 || lngNum > 180) {
    return { valid: false, message: 'lng must be a number between -180 and 180' };
  }

  return { valid: true };
}

module.exports = { validateAnalyzeInput };
