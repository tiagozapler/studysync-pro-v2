export interface GroqMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export class GroqAdapter {
  private apiKey: string;
  private baseUrl = 'https://api.groq.com/openai/v1';
  private model = 'llama3-8b-8192';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async sendMessageStream(
    message: string,
    context?: {
      history?: GroqMessage[];
      systemPrompt?: string;
      courseName?: string;
      extraContext?: string;
    }
  ): Promise<ReadableStream<string>> {
    try {
      // Construir el array de mensajes
      const messages: GroqMessage[] = [];

      // Agregar prompt del sistema
      const systemPrompt =
        context?.systemPrompt ||
        this.getDefaultSystemPrompt(context?.courseName);
      messages.push({
        role: 'system',
        content: systemPrompt,
      });

      // Agregar historial de conversación
      if (context?.history) {
        messages.push(...context.history);
      }

      if (context?.extraContext) {
        messages.push({
          role: 'system',
          content: `Contexto adicional proporcionado:
${context.extraContext}`,
        });
      }

      // Agregar el mensaje actual del usuario
      messages.push({
        role: 'user',
        content: message,
      });

      // Realizar la petición a la API de Groq
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          messages,
          stream: true,
          temperature: 0.7,
          max_tokens: 2048,
        }),
      });

      if (!response.ok) {
        throw new Error(
          `Error de API: ${response.status} ${response.statusText}`
        );
      }

      if (!response.body) {
        throw new Error('No se pudo obtener el stream de respuesta');
      }

      // Crear y retornar el stream de lectura
      return this.createStreamReader(response.body);
    } catch (error) {
      console.error('Error en GroqAdapter:', error);
      throw error;
    }
  }

  private createStreamReader(
    body: ReadableStream<Uint8Array>
  ): ReadableStream<string> {
    const reader = body.getReader();
    const decoder = new TextDecoder();

    return new ReadableStream({
      start(controller) {
        function pump(): Promise<void> {
          return reader.read().then(({ done, value }) => {
            if (done) {
              controller.close();
              return;
            }

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);

                if (data === '[DONE]') {
                  controller.close();
                  return;
                }

                try {
                  const parsed = JSON.parse(data);
                  const content = parsed.choices[0]?.delta?.content;

                  if (content) {
                    controller.enqueue(content);
                  }
                } catch (e) {
                  // Ignorar errores de parsing
                }
              }
            }

            return pump();
          });
        }

        return pump();
      },
      cancel() {
        reader.cancel();
      },
    });
  }

  private getDefaultSystemPrompt(courseName?: string): string {
    const basePrompt = `Eres un asistente académico inteligente y útil. Tu objetivo es ayudar a los estudiantes con sus tareas académicas, explicar conceptos complejos de manera clara y proporcionar orientación educativa.

Características principales:
- Responde en español o inglés según el idioma del usuario
- Proporciona explicaciones claras y estructuradas
- Usa ejemplos prácticos cuando sea útil
- Sugiere recursos adicionales cuando sea apropiado
- Mantén un tono profesional pero amigable
- Si no estás seguro de algo, admítelo honestamente

${courseName ? `Contexto del curso: ${courseName}` : ''}

Recuerda: Tu objetivo es facilitar el aprendizaje y ayudar al estudiante a comprender mejor los conceptos.`;

    return basePrompt;
  }

  // Método para extraer texto de archivos (placeholder para futuras implementaciones)
  async extractText(file: File): Promise<string> {
    // TODO: Implementar extracción de texto de archivos PDF, Word, TXT
    return `[Archivo: ${file.name}] - Extracción de texto no implementada aún`;
  }

  // Método para validar la API key
  async validateApiKey(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      });
      return response.ok;
    } catch (error) {
      console.error('Error validando API key:', error);
      return false;
    }
  }
}
