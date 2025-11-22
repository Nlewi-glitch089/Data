/**
 * Calculate quality scores from analysis results
 * @param {Object} analysis - Result from analyzeDataset()
 * @returns {Object} Quality metrics and scores
 */
export function calculateQualityMetrics(analysis) {
  const { columns, rowCount, columnCount } = analysis;

  // Completeness: % of non-null values
  const completeness = calculateCompleteness(columns, rowCount, columnCount);

  // Consistency: % of values matching expected data type
  const consistency = calculateConsistency(columns);

  // Accuracy: % of values without format issues or outliers
  const accuracy = calculateAccuracy(columns);

  // Composite score (0-100)
  const compositeScore = Math.round((completeness + consistency + accuracy) / 3);

  return {
    completeness: Math.round(completeness),
    consistency: Math.round(consistency),
    accuracy: Math.round(accuracy),
    compositeScore,
    scoreLevel: getScoreLevel(compositeScore),
    summary: generateScoreSummary(compositeScore),
  };
}

/**
 * Calculate completeness score (% of non-null values)
 * @param {Object} columns - Columns from analysis
 * @param {number} rowCount - Total rows
 * @param {number} columnCount - Total columns
 * @returns {number} Score 0-100
 */
function calculateCompleteness(columns, rowCount, columnCount) {
  if (rowCount === 0 || columnCount === 0) return 100;

  const totalCells = rowCount * columnCount;
  const missingCells = Object.values(columns).reduce(
    (sum, col) => sum + col.missingCount,
    0
  );

  return 100 - (missingCells / totalCells) * 100;
}

/**
 * Calculate consistency score (% of values matching expected data type)
 * @param {Object} columns - Columns from analysis
 * @returns {number} Score 0-100
 */
function calculateConsistency(columns) {
  const scores = Object.values(columns).map((col) => {
    const validValues = col.totalRows - col.missingCount - col.formatIssuesCount;
    return (validValues / col.totalRows) * 100;
  });

  return scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 100;
}

/**
 * Calculate accuracy score (% of values without outliers or format issues)
 * @param {Object} columns - Columns from analysis
 * @returns {number} Score 0-100
 */
function calculateAccuracy(columns) {
  const scores = Object.values(columns).map((col) => {
    const problemValues = col.outliersCount + col.formatIssuesCount;
    const validValues = col.totalRows - problemValues;
    return (validValues / col.totalRows) * 100;
  });

  return scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 100;
}

/**
 * Get quality level name based on score
 * @param {number} score - Quality score (0-100)
 * @returns {string} 'Excellent', 'Good', 'Fair', 'Poor'
 */
export function getScoreLevel(score) {
  if (score >= 90) return 'Excellent';
  if (score >= 70) return 'Good';
  if (score >= 50) return 'Fair';
  return 'Poor';
}

/**
 * Get color for score visualization
 * @param {number} score - Quality score (0-100)
 * @returns {string} Hex color
 */
export function getScoreColor(score) {
  if (score >= 90) return '#10b981'; // Green
  if (score >= 70) return '#f59e0b'; // Amber
  if (score >= 50) return '#f97316'; // Orange
  return '#ef4444'; // Red
}

/**
 * Generate human-readable summary of quality score
 * @param {number} score - Quality score (0-100)
 * @returns {string} Summary text
 */
export function generateScoreSummary(score) {
  if (score >= 90) {
    return 'Dataset is in excellent condition with minimal quality issues.';
  }
  if (score >= 70) {
    return 'Dataset is in good condition with some quality issues to address.';
  }
  if (score >= 50) {
    return 'Dataset has fair quality with several issues that should be fixed.';
  }
  return 'Dataset has significant quality issues that require attention.';
}

/**
 * Get metric details for dashboard display
 * @param {Object} metrics - Result from calculateQualityMetrics()
 * @returns {Array} Array of metric objects for charts
 */
export function getMetricChartData(metrics) {
  return [
    { label: 'Completeness', value: metrics.completeness, color: '#3b82f6' },
    { label: 'Consistency', value: metrics.consistency, color: '#10b981' },
    { label: 'Accuracy', value: metrics.accuracy, color: '#f59e0b' },
  ];
}
