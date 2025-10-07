import pdf from 'pdf-parse';
import officeParser from 'officeparser';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';

/*
<important_code_snippet_instructions>
The newest Anthropic model is "claude-sonnet-4-20250514", not "claude-3-7-sonnet-20250219", "claude-3-5-sonnet-20241022" nor "claude-3-sonnet-20240229". 
If the user doesn't specify a model, always prefer using "claude-sonnet-4-20250514" as it is the latest model.
</important_code_snippet_instructions>
*/

const DEFAULT_ANTHROPIC_MODEL = "claude-sonnet-4-20250514";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface DocumentExtractionResult {
  text: string;
  metadata: {
    pages?: number;
    wordCount: number;
    fileType: string;
  };
}

interface FrameworkStructure {
  name: string;
  description: string;
  sections: Array<{
    title: string;
    content: string;
    type: 'text' | 'analysis' | 'data' | 'query';
  }>;
  suggestedTags: string[];
  apiCapabilities: {
    database: boolean;
    perplexity: boolean;
    claude: boolean;
    openai: boolean;
    football: boolean;
  };
  extractedMetrics?: string[];
  extractedQueries?: string[];
}

/**
 * Extract text from PDF or Word document
 */
export async function extractTextFromDocument(
  fileBuffer: Buffer,
  mimeType: string
): Promise<DocumentExtractionResult> {
  try {
    let extractedText = '';
    let metadata: DocumentExtractionResult['metadata'];

    if (mimeType === 'application/pdf') {
      const pdfData = await pdf(fileBuffer);
      extractedText = pdfData.text;
      metadata = {
        pages: pdfData.numpages,
        wordCount: extractedText.split(/\s+/).length,
        fileType: 'pdf',
      };
    } else if (
      mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      mimeType === 'application/msword'
    ) {
      extractedText = await officeParser.parseOfficeAsync(fileBuffer);
      metadata = {
        wordCount: extractedText.split(/\s+/).length,
        fileType: 'word',
      };
    } else {
      throw new Error(`Unsupported file type: ${mimeType}`);
    }

    return {
      text: extractedText,
      metadata,
    };
  } catch (error: any) {
    throw new Error(`Failed to extract text: ${error.message}`);
  }
}

/**
 * Convert extracted document text to a framework structure using AI
 */
export async function convertDocumentToFramework(
  extractedText: string,
  fileName: string,
  aiProvider: 'openai' | 'claude' = 'claude'
): Promise<FrameworkStructure> {
  const prompt = `You are an expert at analyzing documents and converting them into structured analytical frameworks.

Analyze the following document and create a comprehensive framework structure:

DOCUMENT CONTENT:
${extractedText.substring(0, 15000)} ${extractedText.length > 15000 ? '...[truncated]' : ''}

TASK:
1. Extract the main purpose and create a clear framework name (max 60 chars)
2. Write a concise description (max 200 chars)
3. Organize content into logical sections with types:
   - "text": Static information/explanation
   - "analysis": Analytical insights or methodology
   - "data": Data structures, tables, or metrics
   - "query": Questions or data queries to be answered
4. Identify which APIs would be useful:
   - database: If it needs to query or store data
   - perplexity: If it needs real-time research/facts
   - claude: If it needs advanced reasoning/analysis
   - openai: If it needs creative generation/completion
   - football: If it involves football/soccer analysis
5. Suggest 3-5 relevant tags
6. Extract any metrics or KPIs mentioned
7. Extract any queries or questions that need answering

Return a JSON object with this structure:
{
  "name": "Framework Name",
  "description": "Brief description",
  "sections": [
    {
      "title": "Section Title",
      "content": "Section content",
      "type": "text|analysis|data|query"
    }
  ],
  "suggestedTags": ["tag1", "tag2"],
  "apiCapabilities": {
    "database": true|false,
    "perplexity": true|false,
    "claude": true|false,
    "openai": true|false,
    "football": true|false
  },
  "extractedMetrics": ["metric1", "metric2"],
  "extractedQueries": ["query1", "query2"]
}`;

  try {
    let responseText: string;

    if (aiProvider === 'claude') {
      const response = await anthropic.messages.create({
        model: DEFAULT_ANTHROPIC_MODEL,
        max_tokens: 4096,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      responseText = response.content[0].type === 'text' ? response.content[0].text : '';
    } else {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are an expert at analyzing documents and creating structured frameworks. Always respond with valid JSON.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        response_format: { type: 'json_object' },
        max_tokens: 4096,
      });

      responseText = response.choices[0].message.content || '';
    }

    // Extract JSON from response (handle markdown code blocks)
    const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || [null, responseText];
    const jsonStr = jsonMatch[1] || responseText;
    
    const framework: FrameworkStructure = JSON.parse(jsonStr);

    // Validate and set defaults
    if (!framework.name) framework.name = fileName.replace(/\.[^/.]+$/, '');
    if (!framework.description) framework.description = 'Imported from document';
    if (!framework.sections) framework.sections = [];
    if (!framework.suggestedTags) framework.suggestedTags = [];
    if (!framework.apiCapabilities) {
      framework.apiCapabilities = {
        database: false,
        perplexity: false,
        claude: false,
        openai: false,
        football: false,
      };
    }

    return framework;
  } catch (error: any) {
    console.error('AI conversion error:', error);
    
    // Fallback: Create basic framework structure
    return {
      name: fileName.replace(/\.[^/.]+$/, ''),
      description: 'Imported from document - AI processing failed, manual review needed',
      sections: [
        {
          title: 'Extracted Content',
          content: extractedText.substring(0, 5000) + (extractedText.length > 5000 ? '...' : ''),
          type: 'text',
        },
      ],
      suggestedTags: ['imported', 'needs-review'],
      apiCapabilities: {
        database: false,
        perplexity: false,
        claude: false,
        openai: false,
        football: false,
      },
    };
  }
}

/**
 * Full pipeline: Extract and convert document to framework
 */
export async function processDocumentToFramework(
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string,
  aiProvider: 'openai' | 'claude' = 'claude'
): Promise<{
  framework: FrameworkStructure;
  extractedText: string;
  metadata: DocumentExtractionResult['metadata'];
}> {
  const { text, metadata } = await extractTextFromDocument(fileBuffer, mimeType);
  const framework = await convertDocumentToFramework(text, fileName, aiProvider);

  return {
    framework,
    extractedText: text,
    metadata,
  };
}
