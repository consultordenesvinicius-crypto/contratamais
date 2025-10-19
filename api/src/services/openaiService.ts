import axios from 'axios';

import env from '../config/env';
import logger from '../utils/logger';

export interface ChatCompletionMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatCompletionResponse {
  message: string;
  model: string;
}

export async function createChatCompletion(messages: ChatCompletionMessage[]): Promise<ChatCompletionResponse> {
  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: env.OPENAI_MODEL,
        messages,
      },
      {
        headers: {
          Authorization: `Bearer ${env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 25000,
      },
    );

    const choice = response.data.choices?.[0];
    const message = choice?.message?.content ?? '';

    return {
      message,
      model: response.data.model ?? env.OPENAI_MODEL,
    };
  } catch (error) {
    logger.error({ error }, 'Failed to create chat completion');
    throw error;
  }
}
