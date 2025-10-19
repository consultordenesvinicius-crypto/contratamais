const { log, logError } = require('../utils/logger');

const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

async function generateResponse({ prompt, context = [] }) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    log('OPENAI_API_KEY não configurada. Retornando resposta simulada.');
    return {
      content: 'Configurar a variável de ambiente OPENAI_API_KEY para receber respostas reais da IA.',
      isMock: true,
    };
  }

  const messages = [
    {
      role: 'system',
      content: 'Você é um assistente especializado em atendimento ao cliente para a plataforma ContrataMais. Responda sempre em português e mantenha um tom profissional.',
    },
    ...context,
    {
      role: 'user',
      content: prompt,
    },
  ];

  try {
    const response = await fetch(`${OPENAI_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Erro na chamada da OpenAI: ${response.status} ${errorBody}`);
    }

    const data = await response.json();
    const message = data.choices?.[0]?.message?.content?.trim() || '';
    log('Resposta recebida da OpenAI');
    return {
      content: message,
      isMock: false,
      raw: data,
    };
  } catch (error) {
    logError('Falha ao gerar resposta na OpenAI', error);
    return {
      content: 'Não foi possível gerar uma resposta inteligente neste momento. Tente novamente mais tarde.',
      isMock: true,
    };
  }
}

module.exports = {
  generateResponse,
};
