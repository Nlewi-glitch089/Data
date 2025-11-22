import Papa from 'papaparse';

/**
 * Parse CSV, JSON, or Excel file and return array of objects
 * @param {File} file - File from input
 * @param {Object} opts - Optional config (Papa, etc)
 * @returns {Promise<Array>} Array of objects
 */
export async function parseFile(file, opts = {}) {
  if (!file) throw new Error('No file provided');

  const ext = (file.name || '').split('.').pop().toLowerCase();
  const Pap = opts.Papa || Papa;

  // JSON files
  if (ext === 'json') {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const parsed = JSON.parse(e.target.result);
          if (Array.isArray(parsed)) {
            resolve(parsed);
          } else if (parsed && parsed.data && Array.isArray(parsed.data)) {
            resolve(parsed.data);
          } else if (parsed && typeof parsed === 'object') {
            resolve([parsed]);
          } else {
            reject(new Error('JSON must be an array or object'));
          }
        } catch (err) {
          reject(new Error(`JSON parse error: ${err.message}`));
        }
      };
      reader.onerror = () => reject(new Error('File read failed'));
      reader.readAsText(file);
    });
  }

  // CSV/TXT files
  if (ext === 'csv' || ext === 'txt') {
    return new Promise((resolve, reject) => {
      Pap.parse(file, {
        header: true,
        dynamicTyping: false,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.errors && results.errors.length > 0) {
            reject(new Error(`CSV parse error: ${results.errors[0].message}`));
          } else {
            resolve(results.data || []);
          }
        },
        error: (err) => reject(new Error(`CSV parse error: ${err.message}`)),
      });
    });
  }

  // Excel files (optional - requires xlsx)
  if (ext === 'xlsx' || ext === 'xls') {
    try {
      return (async () => {
        let XLSX;
        try {
          const xlsxModule = await import('xlsx');
          XLSX = xlsxModule.default;
        } catch (importErr) {
          throw new Error(
            'Excel support requires the xlsx package. Install with: npm install xlsx'
          );
        }

        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            try {
              const data = new Uint8Array(e.target.result);
              const workbook = XLSX.read(data, { type: 'array' });

              if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
                throw new Error('No sheets found in Excel file');
              }

              const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
              const json = XLSX.utils.sheet_to_json(firstSheet, { defval: null });

              if (!Array.isArray(json) || json.length === 0) {
                throw new Error('Excel sheet is empty or invalid');
              }

              resolve(json);
            } catch (err) {
              reject(new Error(`Excel parse error: ${err.message}`));
            }
          };
          reader.onerror = () => reject(new Error('File read failed'));
          reader.readAsArrayBuffer(file);
        });
      })();
    } catch (err) {
      throw err;
    }
  }

  throw new Error(`Unsupported file type: .${ext}`);
}

/**
 * Normalize dataset — convert all values to strings or null
 * @param {Array} data - Parsed dataset
 * @returns {Array} Normalized dataset
 */
export function normalizeData(data) {
  if (!Array.isArray(data) || data.length === 0) return [];

  return data.map((row) => {
    if (typeof row !== 'object' || row === null) return row;
    const normalized = {};
    Object.keys(row).forEach((key) => {
      const value = row[key];
      normalized[key] =
        value === null || value === undefined || value === '' ? null : String(value);
    });
    return normalized;
  });
}

/**
 * Extract column names from dataset
 * @param {Array} data - Parsed dataset
 * @returns {Array<string>} Column names
 */
export function getColumnNames(data) {
  if (!Array.isArray(data) || data.length === 0) return [];
  const firstRow = data[0];
  if (typeof firstRow !== 'object' || firstRow === null) return [];
  return Object.keys(firstRow);
}
