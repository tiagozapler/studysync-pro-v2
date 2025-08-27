export interface WebLLMMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export class WebLLMAdapter {
  private model: any = null;
  private isInitialized = false;
  private modelName = 'Llama-2-7b-chat-q4f16_1';

  constructor() {
    this.initializeModel();
  }

  private async initializeModel() {
    try {
      // Importar WebLLM dinámicamente
      const webllm = await import('@mlc-ai/web-llm');
      
      // @ts-ignore - WebLLM types may not be fully compatible
      this.model = new (webllm as any).ChatModule();
      await this.model.reload(this.modelName);
      this.isInitialized = true;
      console.log('✅ WebLLM model initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing WebLLM:', error);
      console.warn('⚠️ Using fallback responses');
    }
  }

  async sendMessageStream(
    message: string,
    context?: {
      history?: WebLLMMessage[];
      systemPrompt?: string;
      courseName?: string;
    }
  ): Promise<ReadableStream<string>> {
    // Si WebLLM no está disponible, usar respuestas predefinidas
    if (!this.isInitialized || !this.model) {
      return this.createFallbackStream(message, context);
    }

    try {
      // Construir el prompt completo
      const systemPrompt = context?.systemPrompt || this.getDefaultSystemPrompt(context?.courseName);
      let fullPrompt = `${systemPrompt}\n\n`;

      // Agregar historial
      if (context?.history) {
        for (const msg of context.history) {
          fullPrompt += `${msg.role === 'user' ? 'Usuario' : 'Asistente'}: ${msg.content}\n`;
        }
      }

      // Agregar mensaje actual
      fullPrompt += `Usuario: ${message}\nAsistente:`;

      // Generar respuesta con WebLLM
      const response = await this.model.generate(fullPrompt, {
        max_gen_len: 1024,
        temperature: 0.7,
        top_p: 0.9
      });

      return this.createStreamFromResponse(response);

    } catch (error) {
      console.error('Error in WebLLM generation:', error);
      return this.createFallbackStream(message, context);
    }
  }

  private createFallbackStream(
    _message: string,
    context?: {
      history?: WebLLMMessage[];
      systemPrompt?: string;
      courseName?: string;
    }
  ): ReadableStream<string> {
    const courseName = context?.courseName || 'este curso';
    
    // Respuestas predefinidas basadas en el contexto
    const responses = [
      `Entiendo tu pregunta sobre ${courseName}. Como asistente académico, puedo ayudarte con:`,
      `- Explicar conceptos difíciles`,
      `- Resolver problemas paso a paso`,
      `- Crear resúmenes de temas`,
      `- Generar preguntas de práctica`,
      `- Ayudar con la organización del estudio`,
      ``,
      `¿En qué aspecto específico de ${courseName} te gustaría que te ayude?`
    ];

    return new ReadableStream({
      start(controller) {
        let index = 0;
        const interval = setInterval(() => {
          if (index < responses.length) {
            controller.enqueue(responses[index]);
            index++;
          } else {
            clearInterval(interval);
            controller.close();
          }
        }, 100);
      }
    });
  }

  private createStreamFromResponse(response: any): ReadableStream<string> {
    return new ReadableStream({
      start(controller) {
        let buffer = '';
        
        const processChunk = (chunk: string) => {
          buffer += chunk;
          
          // Enviar palabras completas
          const words = buffer.split(' ');
          if (words.length > 1) {
            const completeWords = words.slice(0, -1).join(' ') + ' ';
            controller.enqueue(completeWords);
            buffer = words[words.length - 1] || '';
          }
        };

        // Procesar la respuesta de WebLLM
        if (response && typeof response === 'string') {
          processChunk(response);
        } else if (response && response.on) {
          response.on('data', processChunk);
          response.on('end', () => {
            if (buffer) {
              controller.enqueue(buffer);
            }
            controller.close();
          });
        } else {
          controller.close();
        }
      }
    });
  }

  private getDefaultSystemPrompt(courseName?: string): string {
    return `Eres un asistente académico inteligente y útil especializado en ${courseName || 'educación universitaria'}. 

Tu objetivo es ayudar a los estudiantes a:
- Comprender conceptos complejos de manera clara
- Resolver problemas paso a paso
- Crear resúmenes efectivos
- Generar preguntas de práctica
- Organizar el estudio de manera eficiente
- Proporcionar explicaciones adaptadas al nivel del estudiante

Responde de manera clara, concisa y educativa. Si no estás seguro de algo, admítelo honestamente.`;
  }

  // Verificar si el modelo está listo
  isReady(): boolean {
    return this.isInitialized && this.model !== null;
  }

  // Obtener información del modelo
  getModelInfo() {
    return {
      name: this.modelName,
      type: 'WebLLM',
      isReady: this.isReady(),
      isFree: true
    };
  }
}
