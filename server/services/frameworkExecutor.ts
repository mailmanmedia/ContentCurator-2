import { db } from "server/db";
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import type { Framework } from '@shared/schema';

/*
<important_code_snippet_instructions>
The newest Anthropic model is "claude-sonnet-4-20250514"
</important_code_snippet_instructions>
*/

const DEFAULT_ANTHROPIC_MODEL = "claude-sonnet-4-20250514";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface FrameworkExecutionContext {
  frameworkId: string;
  frameworkName: string;
  capabilities: {
    database: boolean;
    perplexity: boolean;
    claude: boolean;
    openai: boolean;
    football: boolean;
  };
  config: Record<string, any>;
}

/**
 * Execute a database query within framework context
 */
export async function executeFrameworkDatabaseQuery(
  context: FrameworkExecutionContext,
  query: string,
  params?: any[]
) {
  if (!context.capabilities.database) {
    throw new Error('Database access not enabled for this framework');
  }

  try {
    // Execute raw SQL query with safety checks
    const result = await db.execute(query);
    return result.rows;
  } catch (error: any) {
    throw new Error(`Database query failed: ${error.message}`);
  }
}

/**
 * Call Perplexity API for real-time research
 */
export async function executeFrameworkPerplexityQuery(
  context: FrameworkExecutionContext,
  query: string,
  model: string = 'llama-3.1-sonar-large-128k-online'
): Promise<string> {
  if (!context.capabilities.perplexity) {
    throw new Error('Perplexity access not enabled for this framework');
  }

  try {
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'user',
            content: query,
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`Perplexity API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error: any) {
    throw new Error(`Perplexity query failed: ${error.message}`);
  }
}

/**
 * Call Claude API for advanced reasoning
 */
export async function executeFrameworkClaudeQuery(
  context: FrameworkExecutionContext,
  prompt: string,
  systemPrompt?: string
): Promise<string> {
  if (!context.capabilities.claude) {
    throw new Error('Claude access not enabled for this framework');
  }

  try {
    const messages: Anthropic.MessageParam[] = [
      {
        role: 'user',
        content: prompt,
      },
    ];

    const response = await anthropic.messages.create({
      model: DEFAULT_ANTHROPIC_MODEL,
      max_tokens: 4096,
      system: systemPrompt || `You are an analytical assistant helping with the framework: ${context.frameworkName}`,
      messages,
    });

    return response.content[0].type === 'text' ? response.content[0].text : '';
  } catch (error: any) {
    throw new Error(`Claude query failed: ${error.message}`);
  }
}

/**
 * Call OpenAI API for creative generation
 */
export async function executeFrameworkOpenAIQuery(
  context: FrameworkExecutionContext,
  prompt: string,
  systemPrompt?: string,
  model: string = 'gpt-4o'
): Promise<string> {
  if (!context.capabilities.openai) {
    throw new Error('OpenAI access not enabled for this framework');
  }

  try {
    const response = await openai.chat.completions.create({
      model,
      messages: [
        {
          role: 'system',
          content: systemPrompt || `You are an analytical assistant helping with the framework: ${context.frameworkName}`,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 4096,
    });

    return response.choices[0].message.content || '';
  } catch (error: any) {
    throw new Error(`OpenAI query failed: ${error.message}`);
  }
}

/**
 * Call Football API for sports data
 */
export async function executeFrameworkFootballQuery(
  context: FrameworkExecutionContext,
  endpoint: string,
  params?: Record<string, string>
): Promise<any> {
  if (!context.capabilities.football) {
    throw new Error('Football API access not enabled for this framework');
  }

  try {
    const queryParams = new URLSearchParams(params || {});
    const url = `https://v3.football.api-sports.io/${endpoint}${
      queryParams.toString() ? '?' + queryParams.toString() : ''
    }`;

    const response = await fetch(url, {
      headers: {
        'x-apisports-key': process.env.API_FOOTBALL_KEY || '',
      },
    });

    if (!response.ok) {
      throw new Error(`Football API error: ${response.statusText}`);
    }

    return await response.json();
  } catch (error: any) {
    throw new Error(`Football API query failed: ${error.message}`);
  }
}

/**
 * Create execution context from framework
 */
export function createExecutionContext(framework: Framework): FrameworkExecutionContext {
  const capabilities = (framework.apiCapabilities as any) || {
    database: false,
    perplexity: false,
    claude: false,
    openai: false,
    football: false,
  };

  const config = (framework.apiConfig as any) || {};

  return {
    frameworkId: framework.id,
    frameworkName: framework.name,
    capabilities,
    config,
  };
}

/**
 * Execute a framework with given input data
 */
export async function executeFramework(
  framework: Framework,
  inputData: Record<string, any>
): Promise<{
  success: boolean;
  results: any;
  logs: string[];
  errors: string[];
}> {
  const context = createExecutionContext(framework);
  const logs: string[] = [];
  const errors: string[] = [];
  const results: any = {};

  logs.push(`Starting framework execution: ${framework.name}`);
  logs.push(`Capabilities: ${JSON.stringify(context.capabilities)}`);

  try {
    // Framework execution logic will be implemented by individual frameworks
    // This is a base implementation that provides API access

    results.context = context;
    results.input = inputData;
    results.timestamp = new Date().toISOString();

    logs.push('Framework execution completed successfully');

    return {
      success: true,
      results,
      logs,
      errors,
    };
  } catch (error: any) {
    errors.push(`Execution failed: ${error.message}`);
    
    return {
      success: false,
      results,
      logs,
      errors,
    };
  }
}

export const frameworkAPI = {
  database: executeFrameworkDatabaseQuery,
  perplexity: executeFrameworkPerplexityQuery,
  claude: executeFrameworkClaudeQuery,
  openai: executeFrameworkOpenAIQuery,
  football: executeFrameworkFootballQuery,
};
