export type AiTone = 'natural' | 'confident' | 'concise';
export type AiDuration = '30s' | '60s' | '2m' | '5m';

export const AI_PROXY_URL = 'https://stealth-ai.gastonmaid2018.workers.dev/';

export interface GenerateAiScriptParams {
  prompt: string;
  tone?: AiTone;
  duration?: AiDuration;
  language?: string;
}

export interface GenerateAiScriptResult {
  script: string;
  remaining: number | null;
}

export async function generateAiScript(
  params: GenerateAiScriptParams
): Promise<GenerateAiScriptResult> {
  const prompt = params.prompt.trim();
  if (prompt.length < 3) {
    throw new Error('EMPTY_PROMPT');
  }

  let response: Response;
  try {
    response = await fetch(AI_PROXY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Stealth-Client': '1',
      },
      body: JSON.stringify({
        prompt,
        tone: params.tone ?? 'natural',
        duration: params.duration ?? '60s',
        language: 'auto',
      }),
    });
  } catch {
    throw new Error('NETWORK_ERROR');
  }

  const data = (await response.json().catch(() => ({}))) as {
    script?: string;
    remaining?: number | null;
    error?: string;
  };

  if (!response.ok) {
    const errMsg = data.error || `HTTP ${response.status}`;
    if (response.status === 429 || /limit|rate|daily|quota|exceeded/i.test(errMsg)) {
      throw new Error('RATE_LIMIT');
    }
    throw new Error(errMsg);
  }

  if (!data.script || typeof data.script !== 'string') {
    throw new Error('EMPTY_RESPONSE');
  }

  return {
    script: data.script.trim(),
    remaining: typeof data.remaining === 'number' ? data.remaining : null,
  };
}
