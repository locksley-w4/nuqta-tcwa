// Triggers a browser download of the full analysis as JSON.
export function downloadReport({ result, finance, address }) {
  if (!result) return;

  const payload = {
    generatedAt: new Date().toISOString(),
    businessType: result.businessType,
    coordinates: result.coordinates,
    address: address || null,
    summary: result.summary,
    blocks: result.blocks,
    blockScores: result.blockScores,
    weights: result.weights,
    reasoning: result.reasoning,
    finance: finance || null,
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const slug = (result.businessType || 'business')
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
  const ts = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `analysis-${slug}-${ts}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
