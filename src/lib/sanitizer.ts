export class ScriptSanitizer {
  static sanitize(text: string): string {
    if (typeof text !== 'string') return '';
    let sanitized = text.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '');
    sanitized = sanitized.replace(/[\f\v]/g, '\n');
    sanitized = sanitized.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    sanitized = sanitized
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
    return sanitized;
  }

  static parseWords(text: string): string[] {
    if (!text || text.trim().length === 0) return [];
    return text.trim().split(/\s+/);
  }

  static detectRtl(text: string): boolean {
    const rtlRegex = /[\u0590-\u05FF\u0600-\u06FF]/;
    return rtlRegex.test(text);
  }
}

export function calculateScriptMetrics(text: string, wpm: number = 150): { wordCount: number; estimatedMinutes: number } {
  if (!text || text.trim().length === 0) {
    return { wordCount: 0, estimatedMinutes: 0 };
  }
  const safeWpm = (typeof wpm !== 'number' || isNaN(wpm) || wpm <= 0) ? 150 : wpm;
  const words = text.trim().split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const estimatedMinutes = Math.round((wordCount / safeWpm) * 10) / 10;
  return { wordCount, estimatedMinutes };
}
