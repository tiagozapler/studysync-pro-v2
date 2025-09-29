import Groq from 'groq-sdk';

export const groq = new Groq({
  apiKey: import.meta.env.VITE_GROQ_API_KEY,
});

export async function askGroq(prompt: string) {
  const completion = await groq.chat.completions.create({
    model: 'llama-3.1-70b-versatile',
    messages: [{ role: 'user', content: prompt }],
  });

  return completion.choices[0]?.message?.content || '';
}
