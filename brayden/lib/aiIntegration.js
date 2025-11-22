/**
 * Generate AI insights from data quality analysis
 * Calls secure backend API that handles OpenAI credentials
 * @param {Object} analysis - Result from analyzeDataset()
 * @param {Object} metrics - Result from calculateQualityMetrics()
 * @param {string} fileName - Original file name
 * @returns {Promise<Object>} AI insights
 */
export async function generateAIInsights(analysis, metrics, fileName = 'dataset') {
  try {
    const response = await fetch('/api/insights', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        analysis,
        metrics,
        fileName,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to generate insights');
    }

    return await response.json();
  } catch (error) {
    console.error('AI insights error:', error);
    return {
      summary: `Error generating insights: ${error.message}`,
      recommendations: [],
      columnInsights: {},
      error: error.message,
    };
  }
}

/**
 * Generate recommendations for specific column
 * @param {Object} columnAnalysis - Analysis of single column
 * @returns {Array} Array of recommendations
 */
export function getColumnRecommendations(columnAnalysis) {
  const recommendations = [];

  if (columnAnalysis.missingCount > 0) {
    recommendations.push({
      type: 'missing',
      message: `Handle ${columnAnalysis.missingCount} missing values`,
      actions: [
        'Remove rows with missing data',
        'Impute with average (for numeric) or mode',
        'Mark as "unknown"',
      ],
    });
  }

  if (columnAnalysis.duplicateCount > 0) {
    recommendations.push({
      type: 'duplicates',
      message: `Address ${columnAnalysis.duplicateCount} duplicate values`,
      actions: [
        'Remove exact duplicates',
        'Normalize values (trim, lowercase)',
        'Consolidate variants (e.g., "USA" vs "US")',
      ],
    });
  }

  if (columnAnalysis.outliersCount > 0) {
    recommendations.push({
      type: 'outliers',
      message: `Review ${columnAnalysis.outliersCount} potential outliers`,
      actions: [
        'Validate against business rules',
        'Remove if erroneous',
        'Keep if legitimate',
      ],
    });
  }

  if (columnAnalysis.formatIssuesCount > 0) {
    recommendations.push({
      type: 'format',
      message: `Fix ${columnAnalysis.formatIssuesCount} format inconsistencies`,
      actions: [
        'Standardize formatting',
        'Use regex validation',
        'Apply consistent parsing rules',
      ],
    });
  }

  return recommendations;
}
