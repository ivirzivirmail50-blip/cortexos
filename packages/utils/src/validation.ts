/**
 * Input Sanitization & Validation Utilities
 * Protect against prompt injection and malicious inputs
 */

// ============================================
// 🔒 Prompt Injection Detection (10+ Patterns)
// ============================================

const DANGEROUS_PATTERNS = [
  /ignore\s+(previous|all)\s+(instructions|rules)/gi,      // "ignore previous instructions"
  /forget\s+(everything|all|previous|all\s+instructions)/gi, // "forget everything"
  /you\s+are\s+(now|no\s+longer)/gi,                        // "you are now"
  /system\s+prompt/gi,                                       // "system prompt"
  /disregard\s+(all|previous|the)\s+(instructions|rules)/gi, // "disregard all instructions"
  /override\s+(your|the)\s+(instructions|rules|settings)/gi, // "override your instructions"
  /bypass\s+(security|restrictions|limits)/gi,               // "bypass security"
  /pretend\s+(you\s+are|to\s+be)/gi,                         // "pretend you are"
  /act\s+as\s+(if\s+)?(you're|you are|a|an)/gi,              // "act as"
  /reset\s+(your|the)\s+(memory|context|instructions)/gi,    // "reset your memory"
  /jailbreak/gi,                                             // "jailbreak"
  /print\s+(the|your)\s+(instructions|system\s+prompt|rules)/gi, // "print your instructions"
  /output\s+(the|your)\s+(initial|system|original)\s+(prompt|instructions)/gi, // "output your initial prompt"
  /what\s+(was|were)\s+(your|the)\s+(original|initial|system)\s+(prompt|instructions)/gi, // "what was your original prompt"
  /from\s+now\s+on/gi,                                       // "from now on"
  /for\s+the\s+rest\s+of\s+(this|our)\s+(conversation|session)/gi, // "for the rest of this conversation"
];

/**
 * Sanitize user input to prevent prompt injection attacks
 * Replaces matched dangerous patterns with [REDACTED]
 */
export function sanitizeUserInput(input: string): string {
  let sanitized = input;
  const foundPatterns: string[] = [];

  DANGEROUS_PATTERNS.forEach((pattern) => {
    if (pattern.test(sanitized)) {
      foundPatterns.push(pattern.toString());
      sanitized = sanitized.replace(pattern, '[REDACTED]');
    }
  });

  if (foundPatterns.length > 0) {
    console.warn('⚠️ Potential prompt injection detected:', {
      patterns: foundPatterns,
      originalLength: input.length,
      sanitizedLength: sanitized.length,
    });
  }

  return sanitized;
}

/**
 * Check if input contains potential prompt injection
 * Returns true if any dangerous pattern is detected
 */
export function detectPromptInjection(input: string): boolean {
  return DANGEROUS_PATTERNS.some((pattern) => pattern.test(input));
}

// ============================================
// 📝 Zod Schemas for API Validation
// ============================================

// Define agent types matching existing agents in the repo
export const agentTypes = [
  'planner',
  'writer',
  'researcher',
  'coder',
  'summarizer',
  'analyst',
  'orchestrator',
] as const;

export type AgentType = (typeof agentTypes)[number];

/**
 * Simple validation result interface (no Zod dependency)
 */
export interface ValidationResult<T> {
  valid: boolean;
  data?: T;
  error?: string;
}

/**
 * Chat input data structure
 */
export interface ChatInput {
  message: string;
  agent?: AgentType;
  model?: string;
  conversationId?: string;
}

/**
 * Validate chat input manually (without Zod)
 * - message: string, min 1, max 5000 characters
 * - agent: must be one of the existing agent names
 * - model: optional string
 */
export function validateChatInput(
  input: unknown
): ValidationResult<ChatInput> {
  if (!input || typeof input !== 'object') {
    return { valid: false, error: 'Invalid input: expected an object' };
  }

  const obj = input as Record<string, unknown>;

  // Validate message
  const message = obj.message;
  if (typeof message !== 'string') {
    return { valid: false, error: 'Message must be a string' };
  }
  if (message.length < 1) {
    return { valid: false, error: 'Message cannot be empty' };
  }
  if (message.length > 5000) {
    return { valid: false, error: 'Message too long (max 5000 characters)' };
  }

  // Validate agent (optional)
  const agent = obj.agent as string | undefined;
  if (agent !== undefined && !agentTypes.includes(agent as AgentType)) {
    return { 
      valid: false, 
      error: `Invalid agent. Must be one of: ${agentTypes.join(', ')}` 
    };
  }

  // Validate model (optional)
  const model = obj.model;
  if (model !== undefined && typeof model !== 'string') {
    return { valid: false, error: 'Model must be a string' };
  }

  // Validate conversationId (optional)
  const conversationId = obj.conversationId;
  if (conversationId !== undefined && typeof conversationId !== 'string') {
    return { valid: false, error: 'Conversation ID must be a string' };
  }

  // Sanitize the message
  const sanitizedMessage = sanitizeUserInput(message);

  return {
    valid: true,
    data: {
      message: sanitizedMessage,
      agent: agent as AgentType | undefined,
      model: model as string | undefined,
      conversationId: conversationId as string | undefined,
    },
  };
}

/**
 * Rate limit check result
 */
export interface RateLimitResult {
  allowed: boolean;
  retryAfter?: number; // Seconds until retry is allowed (only present if allowed is false)
}

/**
 * In-memory RateLimiter class
 * Limits to 10 requests per 10 seconds per key
 */
export class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private readonly maxRequests: number = 10;
  private readonly windowMs: number = 10000; // 10 seconds

  /**
   * Check if a request is allowed for the given key
   * @param key - Unique identifier (e.g., IP address, user ID)
   * @returns Object with allowed status and optional retryAfter in seconds
   */
  check(key: string): RateLimitResult {
    const now = Date.now();
    const userRequests = this.requests.get(key) || [];

    // Remove old requests outside the window
    const recentRequests = userRequests.filter((time) => now - time < this.windowMs);

    if (recentRequests.length >= this.maxRequests) {
      const oldestRequest = Math.min(...recentRequests);
      const resetTime = oldestRequest + this.windowMs;
      const retryAfterSeconds = Math.ceil((resetTime - now) / 1000);

      return {
        allowed: false,
        retryAfter: retryAfterSeconds,
      };
    }

    // Add current request
    recentRequests.push(now);
    this.requests.set(key, recentRequests);

    return {
      allowed: true,
    };
  }

  /**
   * Reset rate limit tracking for a key
   */
  reset(key: string): void {
    this.requests.delete(key);
  }

  /**
   * Clear all rate limit tracking
   */
  clear(): void {
    this.requests.clear();
  }
}

// Export a singleton instance
export const rateLimiter = new RateLimiter();

// ============================================
// 🛡️ Security Headers Helper
// ============================================

export const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';",
};

// ============================================
// 📊 Input Statistics
// ============================================

export interface InputStats {
  characterCount: number;
  wordCount: number;
  lineCount: number;
  containsCode: boolean;
  containsUrls: boolean;
  language?: string;
}

export function analyzeInput(input: string): InputStats {
  const chars = input.length;
  const words = input.trim().split(/\s+/).filter(Boolean).length;
  const lines = input.split('\n').length;
  const containsCode = /```|`[^`]+`|\b(function|const|let|var|import|export)\b/i.test(input);
  const containsUrls = /https?:\/\/[^\s]+/i.test(input);

  return {
    characterCount: chars,
    wordCount: words,
    lineCount: lines,
    containsCode,
    containsUrls,
    language: detectLanguage(input),
  };
}

function detectLanguage(input: string): string | undefined {
  // Simple heuristic - can be enhanced with proper language detection
  const turkishChars = /[ğüşöçİĞÜŞÖÇ]/;
  if (turkishChars.test(input)) return 'tr';

  const germanChars = /[äöüßÄÖÜ]/;
  if (germanChars.test(input)) return 'de';

  const frenchChars = /[àâéèêëïîôùûüÿœæÀÂÉÈÊËÏÎÔÙÛÜŸŒÆ]/;
  if (frenchChars.test(input)) return 'fr';

  return 'en'; // Default
}
