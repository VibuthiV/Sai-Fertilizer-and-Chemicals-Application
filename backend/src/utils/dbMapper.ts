// src/utils/dbMapper.ts — Database Result Key Formatter

/**
 * Recursively converts object keys from snake_case to camelCase.
 */
export function camelizeKeys(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map((v) => camelizeKeys(v));
  } else if (obj !== null && obj !== undefined && obj.constructor === Object) {
    return Object.keys(obj).reduce((result, key) => {
      const camelCaseKey = key.replace(/_([a-z0-9])/g, (_, g) => g.toUpperCase());
      result[camelCaseKey] = camelizeKeys(obj[key]);
      return result;
    }, {} as any);
  }
  return obj;
}
