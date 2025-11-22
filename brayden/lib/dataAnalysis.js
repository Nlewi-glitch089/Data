// Simple data analysis utilities

function inferType(values){
  // values: array of non-null samples
  if(values.length === 0) return 'unknown'
  const isInt = values.every(v => Number.isInteger(v))
  const isNum = values.every(v => typeof v === 'number' && !Number.isNaN(v))
  if(isInt) return 'integer'
  if(isNum) return 'number'

  const emailRe = /^[^@\s]+@[^@\s]+\.[^@\s]+$/
  if(values.every(v => typeof v === 'string' && emailRe.test(v))) return 'email'

  // date detection: try Date.parse on strings
  if(values.every(v => {
    if(typeof v !== 'string') return false
    const t = Date.parse(v)
    return !Number.isNaN(t)
  })) return 'date'

  return 'text'
}

function statsForColumn(values){
  const total = values.length
  const missing = values.filter(v => v === null || v === undefined || v === '').length
  const nonMissing = values.filter(v => !(v === null || v === undefined || v === ''))
  const uniqueSet = new Set(nonMissing.map(v => String(v)))
  const unique = uniqueSet.size
  const samples = nonMissing.slice(0,20)
  const type = inferType(samples)

  // outlier detection for numeric
  let outliers = 0
  if(nonMissing.length > 0 && nonMissing.every(v => typeof v === 'number' || (!isNaN(Number(v)) && v !== ''))){
    const nums = nonMissing.map(v => Number(v)).sort((a,b)=>a-b)
    const q1 = nums[Math.floor((nums.length-1)*0.25)]
    const q3 = nums[Math.floor((nums.length-1)*0.75)]
    const iqr = q3 - q1
    const lower = q1 - 1.5*iqr
    const upper = q3 + 1.5*iqr
    outliers = nums.filter(n=> n < lower || n > upper).length
  }

  return { total, missing, unique, type, samples, outliers }
}

/**
 * Analyze dataset quality — missing values, data types, duplicates, outliers, format consistency
 * @param {Array} data - Array of objects (parsed dataset)
 * @returns {Object} Analysis results with per-column stats
 */
export function analyzeDataset(data) {
  if (!Array.isArray(data) || data.length === 0) {
    return { columns: {}, rowCount: 0, columnCount: 0 };
  }

  const rowCount = data.length;
  const firstRow = data[0];
  const columnNames = Object.keys(firstRow);
  const columnCount = columnNames.length;
  const columns = {};

  columnNames.forEach((col) => {
    columns[col] = analyzeColumn(data, col);
  });

  return {
    columns,
    rowCount,
    columnCount,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Analyze a single column for quality metrics
 * @param {Array} data - Full dataset
 * @param {string} columnName - Column to analyze
 * @returns {Object} Column analysis
 */
function analyzeColumn(data, columnName) {
  const values = data.map((row) => row[columnName]);
  const nonNullValues = values.filter((v) => v !== null && v !== undefined && v !== '');
  const nullCount = values.length - nonNullValues.length;
  const uniqueValues = new Set(nonNullValues);
  const uniqueCount = uniqueValues.size;

  const dataType = inferDataType(nonNullValues);
  const duplicateCount = values.length - uniqueCount;
  const outliers = dataType === 'number' ? detectOutliers(nonNullValues) : [];
  const formatIssues = detectFormatIssues(nonNullValues, dataType);

  return {
    columnName,
    totalRows: values.length,
    missingCount: nullCount,
    missingPercent: ((nullCount / values.length) * 100).toFixed(2),
    uniqueCount,
    uniquePercent: ((uniqueCount / values.length) * 100).toFixed(2),
    dataType,
    duplicateCount,
    duplicatePercent: ((duplicateCount / values.length) * 100).toFixed(2),
    outliersCount: outliers.length,
    outliersPercent: ((outliers.length / nonNullValues.length) * 100).toFixed(2),
    outlierValues: outliers.slice(0, 5), // Top 5 outliers
    formatIssuesCount: formatIssues.length,
    formatIssuesPercent: ((formatIssues.length / nonNullValues.length) * 100).toFixed(2),
    examples: nonNullValues.slice(0, 5), // First 5 non-null values
  };
}

/**
 * Infer data type of column values
 * @param {Array} values - Non-null column values
 * @returns {string} 'number', 'date', 'email', 'url', 'boolean', 'text'
 */
export function inferDataType(values) {
  if (values.length === 0) return 'unknown';

  const sample = values.slice(0, Math.min(100, values.length));
  let numberCount = 0;
  let dateCount = 0;
  let emailCount = 0;
  let urlCount = 0;
  let booleanCount = 0;

  sample.forEach((val) => {
    const str = String(val).trim().toLowerCase();

    if (str === 'true' || str === 'false') {
      booleanCount++;
    } else if (!isNaN(parseFloat(str)) && isFinite(str)) {
      numberCount++;
    } else if (isValidEmail(str)) {
      emailCount++;
    } else if (isValidUrl(str)) {
      urlCount++;
    } else if (isValidDate(str)) {
      dateCount++;
    }
  });

  const types = [
    { type: 'number', count: numberCount },
    { type: 'boolean', count: booleanCount },
    { type: 'email', count: emailCount },
    { type: 'url', count: urlCount },
    { type: 'date', count: dateCount },
  ];

  const best = types.reduce((a, b) => (a.count > b.count ? a : b));
  return best.count > sample.length * 0.5 ? best.type : 'text';
}

/**
 * Detect outliers in numeric column (values > 1.5 * IQR)
 * @param {Array} values - Numeric values
 * @returns {Array} Outlier values
 */
export function detectOutliers(values) {
  const nums = values.map((v) => parseFloat(v)).filter((v) => !isNaN(v));
  if (nums.length < 4) return [];

  nums.sort((a, b) => a - b);
  const q1 = nums[Math.floor(nums.length * 0.25)];
  const q3 = nums[Math.floor(nums.length * 0.75)];
  const iqr = q3 - q1;
  const lowerBound = q1 - 1.5 * iqr;
  const upperBound = q3 + 1.5 * iqr;

  return nums.filter((v) => v < lowerBound || v > upperBound);
}

/**
 * Detect format consistency issues (emails, URLs, dates, numbers)
 * @param {Array} values - Column values
 * @param {string} dataType - Inferred data type
 * @returns {Array} Values that don't match expected format
 */
export function detectFormatIssues(values, dataType) {
  const issues = [];

  if (dataType === 'email') {
    issues.push(
      ...values.filter((v) => !isValidEmail(String(v).trim())).slice(0, 10)
    );
  } else if (dataType === 'url') {
    issues.push(...values.filter((v) => !isValidUrl(String(v).trim())).slice(0, 10));
  } else if (dataType === 'date') {
    issues.push(...values.filter((v) => !isValidDate(String(v).trim())).slice(0, 10));
  } else if (dataType === 'number') {
    issues.push(
      ...values.filter((v) => isNaN(parseFloat(String(v).trim()))).slice(0, 10)
    );
  }

  return issues;
}

/* Validation helpers */
function isValidEmail(str) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str);
}

function isValidUrl(str) {
  try {
    new URL(str);
    return true;
  } catch {
    return false;
  }
}

function isValidDate(str) {
  const date = new Date(str);
  return date instanceof Date && !isNaN(date);
}

/**
 * Get data type distribution for pie chart
 * @param {Object} analysis - Result from analyzeDataset()
 * @returns {Object} Type counts
 */
export function getDataTypeDistribution(analysis) {
  const types = {};
  Object.values(analysis.columns).forEach((col) => {
    types[col.dataType] = (types[col.dataType] || 0) + 1;
  });
  return types;
}

/**
 * Get column issues summary for dashboard
 * @param {Object} analysis - Result from analyzeDataset()
 * @returns {Array} Array of columns with issues
 */
export function getColumnIssues(analysis) {
  return Object.values(analysis.columns)
    .map((col) => ({
      ...col,
      issueCount:
        (col.missingCount > 0 ? 1 : 0) +
        (col.duplicateCount > 0 ? 1 : 0) +
        (col.outliersCount > 0 ? 1 : 0) +
        (col.formatIssuesCount > 0 ? 1 : 0),
    }))
    .filter((col) => col.issueCount > 0)
    .sort((a, b) => b.issueCount - a.issueCount);
}
