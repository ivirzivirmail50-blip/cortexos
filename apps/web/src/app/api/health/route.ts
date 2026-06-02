/**
 * Health Check API Endpoint
 * Provides system health status for monitoring
 */

import { NextResponse } from 'next/server';
import { env, validateEnvironment } from '@cortexos/utils';

const START_TIME = Date.now();

export async function GET() {
  try {
    // Database check
    let dbStatus: { status: 'ok' | 'error'; message: string } = { status: 'ok', message: 'Database connection configured' };
    if (!env.DATABASE_URL || env.DATABASE_URL.includes('cortex:cortex')) {
      dbStatus = { status: 'error', message: 'Using default database credentials' };
    }

    // LLM Provider check
    const provider = env.LLM_PROVIDER.toLowerCase();
    const apiKeyEnvVar = `${provider.toUpperCase()}_API_KEY`;
    const hasApiKey = !!(env as Record<string, unknown>)[apiKeyEnvVar];
    
    let llmStatus: { status: 'ok' | 'warn' | 'error'; provider: string; message: string } = {
      status: 'ok',
      provider,
      message: `${provider} configured`,
    };
    
    if (!hasApiKey && provider !== 'ollama') {
      llmStatus = {
        status: 'error',
        provider,
        message: `Missing API key for ${provider}`,
      };
    } else if (!hasApiKey && provider === 'ollama') {
      llmStatus = {
        status: 'warn',
        provider,
        message: 'Ollama configured (local model)',
      };
    }

    // Environment check
    const envValidation = validateEnvironment();
    let envStatus: { status: 'ok' | 'warn' | 'error'; warnings: string[] } = {
      status: 'ok',
      warnings: [],
    };
    
    if (!envValidation.valid) {
      envStatus = {
        status: 'error',
        warnings: envValidation.warnings,
      };
    } else if (envValidation.warnings.length > 0) {
      envStatus = {
        status: 'warn',
        warnings: envValidation.warnings,
      };
    }

    // Calculate overall status
    const checks = {
      database: dbStatus,
      llmProvider: llmStatus,
      environment: envStatus,
    };

    const okCount = [dbStatus.status, llmStatus.status, envStatus.status].filter(
      (s) => s === 'ok'
    ).length;
    const warnCount = [dbStatus.status, llmStatus.status, envStatus.status].filter(
      (s) => s === 'warn'
    ).length;
    const errorCount = [dbStatus.status, llmStatus.status, envStatus.status].filter(
      (s) => s === 'error'
    ).length;

    const overallStatus = errorCount > 0 ? 'unhealthy' : warnCount > 0 ? 'degraded' : 'healthy';
    const uptimeSeconds = Math.floor((Date.now() - START_TIME) / 1000);

    return NextResponse.json({
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: String(uptimeSeconds),
      checks,
      summary: {
        total: 3,
        ok: okCount,
        warnings: warnCount,
        errors: errorCount,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        uptime: '0',
        checks: {
          database: { status: 'error', message: 'Health check failed' },
          llmProvider: { status: 'error', provider: 'unknown', message: 'Health check failed' },
          environment: { status: 'error', warnings: [] },
        },
        summary: { total: 3, ok: 0, warnings: 0, errors: 3 },
      },
      { status: 503 }
    );
  }
}
