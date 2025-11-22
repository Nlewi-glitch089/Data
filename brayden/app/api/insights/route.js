import { OpenAI } from 'openai';

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Server-side only
});

/**
 * Build prompt for OpenAI from analysis data
 */
function buildAnalysisPrompt(analysis, metrics, fileName) {
  const { columns, rowCount, columnCount } = analysis;
  const topIssues = Object.values(columns)
    .sort((a, b) => {
      const aIssues = a.missingCount + a.duplicateCount + a.outliersCount;
      const bIssues = b.missingCount + b.duplicateCount + b.outliersCount;
      return bIssues - aIssues;
    })
    .slice(0, 5);

  const prompt = `
Analyze this dataset quality report and provide insights:

File: ${fileName}
Rows: ${rowCount} | Columns: ${columnCount}

Quality Scores:
- Completeness: ${metrics.completeness}%
- Consistency: ${metrics.consistency}%
- Accuracy: ${metrics.accuracy}%
- Overall Score: ${metrics.compositeScore}/100

Top Issues by Column:
${topIssues
  .map(
    (col) => `
${col.columnName} (${col.dataType}):
  - Missing values: ${col.missingCount} (${col.missingPercent}%)
  - Duplicates: ${col.duplicateCount} (${col.duplicatePercent}%)
  - Outliers: ${col.outliersCount} (${col.outliersPercent}%)
  - Format issues: ${col.formatIssuesCount} (${col.formatIssuesPercent}%)
`
  )
  .join('')}

Provide:
1. Executive summary (2-3 sentences)
2. Top 3 critical issues to fix
3. Specific recommendations for each issue
4. Estimated impact of fixes (high/medium/low)

Format as JSON:
{
  "summary": "...",
  "issues": [
    {"title": "...", "description": "...", "recommendation": "...", "impact": "high/medium/low"}
  ]
}
`;

  return prompt;
}

/**
 * Parse AI response into structured format
 */
function parseAIResponse(content, analysis) {
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON found in response');

    const parsed = JSON.parse(jsonMatch[0]);
    return {
      summary: parsed.summary || '',
      recommendations: parsed.issues || [],
      columnInsights: generateColumnInsights(analysis),
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      summary: content,
      recommendations: [],
      columnInsights: generateColumnInsights(analysis),
      error: 'Failed to parse AI response',
    };
  }
}

/**
 * Generate per-column insights
 */
function generateColumnInsights(analysis) {
  const insights = {};

  Object.values(analysis.columns).forEach((col) => {
    insights[col.columnName] = {
      dataType: col.dataType,
      missingIssue:
        col.missingCount > 0
          ? `${col.missingCount} missing values (${col.missingPercent}%). Consider: Remove rows, impute with median/mean, or mark as unknown.`
          : 'No missing values.',
      duplicateIssue:
        col.duplicateCount > 0
          ? `${col.duplicateCount} duplicate values (${col.duplicatePercent}%). Consider: Deduplication or normalization.`
          : 'No significant duplicates.',
      outlierIssue:
        col.outliersCount > 0
          ? `${col.outliersCount} potential outliers (${col.outliersPercent}%). Review: ${col.outlierValues.join(', ')}`
          : 'No outliers detected.',
      formatIssue:
        col.formatIssuesCount > 0
          ? `${col.formatIssuesCount} format inconsistencies (${col.formatIssuesPercent}%). Examples: ${col.examples.slice(0, 2).join(', ')}`
          : 'Format is consistent.',
    };
  });

  return insights;
}

export async function POST(request) {
  try {
    const { analysis, metrics, fileName } = await request.json();

    if (!process.env.OPENAI_API_KEY) {
      return Response.json(
        {
          summary: 'OpenAI API key not configured. Please add a valid OPENAI_API_KEY to your .env.local file.',
          recommendations: [
            {
              title: 'Add Valid API Key',
              description: 'Get an API key from https://platform.openai.com/api-keys',
              recommendation: 'Update OPENAI_API_KEY in .env.local',
              impact: 'high',
            },
          ],
          columnInsights: generateColumnInsights(analysis),
          error: 'API key missing',
        },
        { status: 200 }
      );
    }

    try {
      const prompt = buildAnalysisPrompt(analysis, metrics, fileName);

      const response = await client.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content:
              'You are a data quality expert. Provide clear, actionable insights about dataset quality issues.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 1500,
      });

      const content = response.choices[0].message.content;
      const insights = parseAIResponse(content, analysis);

      return Response.json(insights);
    } catch (apiError) {
      console.error('OpenAI API error:', apiError);
      
      // Fallback: Generate basic insights without AI
      return Response.json(
        {
          summary: generateBasicSummary(analysis, metrics),
          recommendations: generateBasicRecommendations(analysis),
          columnInsights: generateColumnInsights(analysis),
          isBasic: true,
          note: 'Using basic analysis (AI unavailable)',
        },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error('Insights error:', error);
    return Response.json(
      {
        summary: `Error: ${error.message}`,
        recommendations: [],
        columnInsights: {},
        error: error.message,
      },
      { status: 500 }
    );
  }
}

function generateBasicSummary(analysis, metrics) {
  const { compositeScore, scoreLevel } = metrics;
  const issueCount = Object.values(analysis.columns).filter(
    (col) => col.missingCount > 0 || col.duplicateCount > 0 || col.outliersCount > 0
  ).length;

  return `This dataset has ${issueCount} columns with quality issues. Overall quality score is ${compositeScore}/100 (${scoreLevel}). Review the column details below for specific problems to address.`;
}

function generateBasicRecommendations(analysis) {
  const recommendations = [];
  const columnsWithIssues = Object.values(analysis.columns)
    .filter((col) => col.missingCount > 0 || col.duplicateCount > 0)
    .sort((a, b) => {
      const aIssues = a.missingCount + a.duplicateCount;
      const bIssues = b.missingCount + b.duplicateCount;
      return bIssues - aIssues;
    })
    .slice(0, 3);

  columnsWithIssues.forEach((col) => {
    if (col.missingCount > 0) {
      recommendations.push({
        title: `Handle missing values in ${col.columnName}`,
        description: `${col.missingCount} missing values (${col.missingPercent}%)`,
        recommendation: 'Remove rows, impute with mean/median, or use domain-specific logic',
        impact: 'high',
      });
    }
  });

  return recommendations;
}
