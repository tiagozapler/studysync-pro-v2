// Servicio para extraer contenido de archivos
// En una implementación completa, esto usaría bibliotecas como pdf-parse, mammoth, etc.

export interface ExtractedContent {
  text: string;
  metadata: {
    fileName: string;
    fileType: string;
    pageCount?: number;
    wordCount: number;
    extractedAt: Date;
  };
}

export class FileContentExtractor {
  /**
   * Extrae el contenido de un archivo para análisis
   */
  static async extractContent(file: File): Promise<string> {
    try {
      const fileType = file.type.toLowerCase();
      const fileName = file.name.toLowerCase();

      // PDF
      if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
        return await this.extractPDFContent(file);
      }

      // Documentos de Word
      if (fileType.includes('word') || fileName.endsWith('.doc') || fileName.endsWith('.docx')) {
        return await this.extractWordContent(file);
      }

      // Hojas de cálculo
      if (fileType.includes('excel') || fileType.includes('spreadsheet') || 
          fileName.endsWith('.xls') || fileName.endsWith('.xlsx')) {
        return await this.extractExcelContent(file);
      }

      // Presentaciones
      if (fileType.includes('powerpoint') || fileType.includes('presentation') ||
          fileName.endsWith('.ppt') || fileName.endsWith('.pptx')) {
        return await this.extractPowerPointContent(file);
      }

      // Archivos de texto
      if (fileType.includes('text') || fileName.endsWith('.txt')) {
        return await this.extractTextContent(file);
      }

      // Imágenes (OCR básico con Tesseract.js si está disponible)
      if (fileType.includes('image')) {
        return await this.extractImageContent(file);
      }

      // Fallback: intentar extraer como texto
      return await this.extractTextContent(file);
    } catch (error) {
      console.error('Error extracting file content:', error);
      return '';
    }
  }

  /**
   * Extrae contenido de archivos PDF
   */
  private static async extractPDFContent(file: File): Promise<string> {
    try {
      // Usar PDF.js si está disponible
      if (typeof window !== 'undefined' && 'pdfjsLib' in window) {
        const pdfjsLib = (window as any).pdfjsLib;
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        
        let content = '';
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          content += textContent.items.map((item: any) => item.str).join(' ') + '\n';
        }
        return content;
      }

      // Fallback: usar la API de FileReader
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
          // Intentar extraer texto del PDF (limitado)
          resolve('Contenido PDF (análisis limitado sin PDF.js)');
        };
        reader.readAsArrayBuffer(file);
      });
    } catch (error) {
      console.error('Error extracting PDF content:', error);
      return 'Error al extraer contenido del PDF';
    }
  }

  /**
   * Extrae contenido de archivos de Word
   */
  private static async extractWordContent(file: File): Promise<string> {
    try {
      // Usar mammoth.js si está disponible
      if (typeof window !== 'undefined' && 'mammoth' in window) {
        const mammoth = (window as any).mammoth;
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        return result.value;
      }

      // Fallback: usar FileReader
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
          resolve('Contenido Word (análisis limitado sin mammoth.js)');
        };
        reader.readAsArrayBuffer(file);
      });
    } catch (error) {
      console.error('Error extracting Word content:', error);
      return 'Error al extraer contenido del documento Word';
    }
  }

  /**
   * Extrae contenido de archivos Excel
   */
  private static async extractExcelContent(file: File): Promise<string> {
    try {
      // Usar SheetJS si está disponible
      if (typeof window !== 'undefined' && 'XLSX' in window) {
        const XLSX = (window as any).XLSX;
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        
        let content = '';
        workbook.SheetNames.forEach((sheetName: string) => {
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          content += `Hoja: ${sheetName}\n`;
          jsonData.forEach((row: any) => {
            content += row.join('\t') + '\n';
          });
          content += '\n';
        });
        return content;
      }

      // Fallback
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
          resolve('Contenido Excel (análisis limitado sin SheetJS)');
        };
        reader.readAsArrayBuffer(file);
      });
    } catch (error) {
      console.error('Error extracting Excel content:', error);
      return 'Error al extraer contenido de la hoja de cálculo';
    }
  }

  /**
   * Extrae contenido de archivos PowerPoint
   */
  private static async extractPowerPointContent(file: File): Promise<string> {
    try {
      // Fallback para PowerPoint (difícil de extraer sin librerías especializadas)
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
          resolve('Contenido PowerPoint (análisis limitado - se recomienda convertir a PDF)');
        };
        reader.readAsArrayBuffer(file);
      });
    } catch (error) {
      console.error('Error extracting PowerPoint content:', error);
      return 'Error al extraer contenido de la presentación';
    }
  }

  /**
   * Extrae contenido de archivos de texto
   */
  private static async extractTextContent(file: File): Promise<string> {
    try {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          resolve(reader.result as string);
        };
        reader.onerror = reject;
        reader.readAsText(file);
      });
    } catch (error) {
      console.error('Error extracting text content:', error);
      return 'Error al extraer contenido del archivo de texto';
    }
  }

  /**
   * Extrae contenido de imágenes usando OCR
   */
  private static async extractImageContent(file: File): Promise<string> {
    try {
      // Usar Tesseract.js si está disponible
      if (typeof window !== 'undefined' && 'Tesseract' in window) {
        const Tesseract = (window as any).Tesseract;
        const result = await Tesseract.recognize(file, 'spa+eng');
        return result.data.text;
      }

      // Fallback para imágenes
      return new Promise((resolve) => {
        resolve('Imagen detectada (OCR no disponible - instala Tesseract.js para análisis de texto)');
      });
    } catch (error) {
      console.error('Error extracting image content:', error);
      return 'Error al extraer contenido de la imagen';
    }
  }

  /**
   * Analiza el contenido extraído para encontrar fechas importantes
   */
  static findImportantDates(content: string): Array<{ date: Date; type: string; context: string }> {
    const dates: Array<{ date: Date; type: string; context: string }> = [];
    
    try {
      // Patrones de fechas comunes
      const datePatterns = [
        // DD/MM/YYYY o MM/DD/YYYY
        /(\d{1,2})\/(\d{1,2})\/(\d{4})/g,
        // YYYY-MM-DD
        /(\d{4})-(\d{1,2})-(\d{1,2})/g,
        // DD-MM-YYYY
        /(\d{1,2})-(\d{1,2})-(\d{4})/g,
        // Fechas en español
        /(\d{1,2})\s+de\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\s+de\s+(\d{4})/gi,
      ];

      datePatterns.forEach(pattern => {
        let match;
        while ((match = pattern.exec(content)) !== null) {
          try {
            let date: Date;
            
            if (pattern.source.includes('de')) {
              // Fecha en español
              const day = parseInt(match[1]);
              const month = this.getMonthNumber(match[2].toLowerCase());
              const year = parseInt(match[3]);
              date = new Date(year, month, day);
            } else if (pattern.source.includes('-')) {
              // YYYY-MM-DD o DD-MM-YYYY
              if (pattern.source.startsWith('\\d{4}')) {
                date = new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]));
              } else {
                date = new Date(parseInt(match[3]), parseInt(match[2]) - 1, parseInt(match[1]));
              }
            } else {
              // DD/MM/YYYY o MM/DD/YYYY (asumir DD/MM/YYYY)
              date = new Date(parseInt(match[3]), parseInt(match[2]) - 1, parseInt(match[1]));
            }

            if (!isNaN(date.getTime())) {
              // Determinar tipo de fecha basado en contexto
              const context = this.getDateContext(content, match.index);
              const type = this.determineDateType(context);
              
              dates.push({ date, type, context });
            }
          } catch (dateError) {
            console.warn('Error parsing date:', dateError);
          }
        }
      });
    } catch (error) {
      console.error('Error finding important dates:', error);
    }

    return dates;
  }

  /**
   * Analiza el contenido para encontrar calificaciones
   */
  static findGrades(content: string): Array<{
    name: string;
    score: number;
    maxScore: number;
    weight: number;
    type: string;
  }> {
    const grades: Array<{
      name: string;
      score: number;
      maxScore: number;
      weight: number;
      type: string;
    }> = [];

    try {
      // Patrones de calificaciones
      const gradePatterns = [
        // Nombre: Puntuación / Máximo (Peso%)
        /(\w+(?:\s+\w+)*)\s*[:=]\s*(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)\s*\(?(\d+(?:\.\d+)?)%?\)?/gi,
        // Nombre - Puntuación/Máximo
        /(\w+(?:\s+\w+)*)\s*[-–]\s*(\d+(?:\.\d+)?)\/(\d+(?:\.\d+)?)/gi,
        // Puntuación de Nombre
        /(\d+(?:\.\d+)?)\s+de\s+(\d+(?:\.\d+)?)\s+en\s+(\w+(?:\s+\w+)*)/gi,
      ];

      gradePatterns.forEach(pattern => {
        let match;
        while ((match = pattern.exec(content)) !== null) {
          try {
            let name: string;
            let score: number;
            let maxScore: number;
            let weight: number = 100;

            if (pattern.source.includes('de')) {
              // Puntuación de Nombre
              score = parseFloat(match[1]);
              maxScore = parseFloat(match[2]);
              name = match[3];
            } else {
              // Nombre: Puntuación / Máximo
              name = match[1];
              score = parseFloat(match[2]);
              maxScore = parseFloat(match[3]);
              if (match[4]) {
                weight = parseFloat(match[4]);
              }
            }

            if (!isNaN(score) && !isNaN(maxScore) && name.trim()) {
              const type = this.determineGradeType(name, content);
              grades.push({
                name: name.trim(),
                score,
                maxScore,
                weight,
                type,
              });
            }
          } catch (gradeError) {
            console.warn('Error parsing grade:', gradeError);
          }
        }
      });
    } catch (error) {
      console.error('Error finding grades:', error);
    }

    return grades;
  }

  /**
   * Obtiene el contexto alrededor de una fecha encontrada
   */
  private static getDateContext(content: string, index: number): string {
    const start = Math.max(0, index - 100);
    const end = Math.min(content.length, index + 100);
    return content.substring(start, end);
  }

  /**
   * Determina el tipo de fecha basado en el contexto
   */
  private static determineDateType(context: string): string {
    const lowerContext = context.toLowerCase();
    
    if (lowerContext.includes('examen') || lowerContext.includes('exam')) {
      return 'examen';
    }
    if (lowerContext.includes('trabajo') || lowerContext.includes('assignment') || lowerContext.includes('project')) {
      return 'trabajo';
    }
    if (lowerContext.includes('entrega') || lowerContext.includes('due') || lowerContext.includes('deadline')) {
      return 'entrega';
    }
    if (lowerContext.includes('clase') || lowerContext.includes('class')) {
      return 'clase';
    }
    if (lowerContext.includes('revisión') || lowerContext.includes('review')) {
      return 'revisión';
    }
    
    return 'fecha';
  }

  /**
   * Determina el tipo de calificación basado en el nombre
   */
  private static determineGradeType(name: string, content: string): string {
    const lowerName = name.toLowerCase();
    const lowerContent = content.toLowerCase();
    
    if (lowerName.includes('examen') || lowerName.includes('exam') || lowerContent.includes('examen')) {
      return 'examen';
    }
    if (lowerName.includes('trabajo') || lowerName.includes('project') || lowerContent.includes('trabajo')) {
      return 'trabajo';
    }
    if (lowerName.includes('quiz') || lowerName.includes('test') || lowerContent.includes('quiz')) {
      return 'quiz';
    }
    if (lowerName.includes('participación') || lowerName.includes('participation')) {
      return 'participación';
    }
    if (lowerName.includes('tarea') || lowerName.includes('homework') || lowerContent.includes('tarea')) {
      return 'tarea';
    }
    
    return 'evaluación';
  }

  /**
   * Convierte nombre de mes en español a número
   */
  private static getMonthNumber(monthName: string): number {
    const months: { [key: string]: number } = {
      'enero': 0, 'febrero': 1, 'marzo': 2, 'abril': 3, 'mayo': 4, 'junio': 5,
      'julio': 6, 'agosto': 7, 'septiembre': 8, 'octubre': 9, 'noviembre': 10, 'diciembre': 11
    };
    return months[monthName] || 0;
  }
}
