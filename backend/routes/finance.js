const express = require('express');
const { analyzeFinance } = require('../services/financialAnalyzer');

const router = express.Router();

function nonNegNumber(v) {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

router.post('/', (req, res) => {
  const {
    loanAmount,
    collateralValue,
    monthlyRevenue,
    monthlyExpenses,
    termMonths,
  } = req.body || {};

  const loan = nonNegNumber(loanAmount);
  const collateral = nonNegNumber(collateralValue);
  const revenue = nonNegNumber(monthlyRevenue);
  const expenses = nonNegNumber(monthlyExpenses);
  const term = nonNegNumber(termMonths);

  if (loan == null || loan <= 0) {
    return res.status(400).json({ error: 'loanAmount must be a positive number' });
  }
  if (collateral == null) {
    return res.status(400).json({ error: 'collateralValue must be a non-negative number' });
  }
  if (revenue == null) {
    return res.status(400).json({ error: 'monthlyRevenue must be a non-negative number' });
  }
  if (expenses == null) {
    return res.status(400).json({ error: 'monthlyExpenses must be a non-negative number' });
  }
  if (term == null || term < 1 || term > 360) {
    return res.status(400).json({ error: 'termMonths must be between 1 and 360' });
  }

  const result = analyzeFinance({
    loanAmount: loan,
    collateralValue: collateral,
    monthlyRevenue: revenue,
    monthlyExpenses: expenses,
    termMonths: term,
  });

  res.json(result);
});

module.exports = router;
