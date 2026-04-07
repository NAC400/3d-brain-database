/**
 * Groq AI Verification — Phase 3B
 *
 * Uses the Groq API (fast Llama inference) to score how relevant a paper's
 * abstract is to a claimed brain region. Score 0–100.
 *
 * Requires environment variable:
 *   REACT_APP_GROQ_API_KEY
 *
 * Free tier: https://console.groq.com — no credit card required for low usage.
 *
 * Tier system (per dev plan):
 *   ≥ 80  → auto-approve
 *   30–79 → flag for human review
 *   < 30  → auto-reject
 */

const GROQ_BASE  = 'https://api.groq.com/openai/v1';
const GROQ_MODEL = 'llama-3.3-70b-versatile';  // fast + accurate

const apiKey = process.env.REACT_APP_GROQ_API_KEY ?? '';

export interface VerificationResult {
  score:       number;    // 0–100
  explanation: string;
  tier:        'approve' | 'review' | 'reject';
}

/**
 * Score how relevant a source is to a claimed brain region.
 * Returns null if Groq is not configured.
 */
export async function verifyRelevance(
  title:      string,
  abstract:   string,
  regionName: string,
): Promise<VerificationResult | null> {
  if (!apiKey) return null;

  const prompt = `You are a neuroscience expert reviewing academic source submissions for a 3D brain atlas.

A user claims the following paper is relevant to the brain region: "${regionName}"

Paper title: ${title}

Abstract:
${abstract || '(no abstract available)'}

Task: Score the relevance of this paper to the specified brain region on a scale of 0–100.
- 100 = paper is directly and specifically about this brain region
- 80  = paper studies this region as a primary focus
- 50  = paper mentions or studies this region as part of broader research
- 20  = paper is loosely related to the region or mentions it in passing
- 0   = paper has no meaningful connection to this brain region

Respond with ONLY a JSON object in this exact format (no other text):
{"score": <integer 0-100>, "explanation": "<one sentence explaining the score>"}`;

  try {
    const res = await fetch(`${GROQ_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model:      GROQ_MODEL,
        messages:   [{ role: 'user', content: prompt }],
        max_tokens: 150,
        temperature: 0.1,
      }),
    });

    if (!res.ok) return null;
    const json = await res.json();
    const raw  = json.choices?.[0]?.message?.content ?? '';

    // Parse JSON from response
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) return null;
    const parsed = JSON.parse(match[0]) as { score: number; explanation: string };
    const score  = Math.max(0, Math.min(100, Math.round(parsed.score)));

    return {
      score,
      explanation: parsed.explanation ?? '',
      tier: score >= 80 ? 'approve' : score >= 30 ? 'review' : 'reject',
    };
  } catch {
    return null;
  }
}

export const isGroqConfigured = !!apiKey;
