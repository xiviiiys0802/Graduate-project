// src/api/openai.js
import { OPENAI_API_KEY } from '@env';

export async function fetchRecommendedRecipe(ingredients) {
  const prompt = `다음 재료를 활용한 요리 레시피를 하나만 추천해줘. 재료: ${ingredients.join(', ')}. 
  아래 형식으로 응답해줘:
  이름: 
  재료: 
  레시피:
  사진: `;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: '너는 훌륭한 요리 비서를 연기하고 있어. 이때 거짓없이 실제 존재하는 레시피만을 제공해줘야 해.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'GPT 호출 실패');
  }

  const data = await response.json();
  const message = data.choices?.[0]?.message?.content;

  return message;
}
