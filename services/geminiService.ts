import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function generateAdventureHook() {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: 'Crie um gancho de aventura curto e sombrio para o RPG Soul Eater. Inclua um local, um mistério e uma possível ameaça de Ovo de Kishin. Responda em Português.',
  });
  return response.text;
}

export async function generateNPC(role: string) {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Crie um NPC para o RPG Soul Eater com a função de ${role}. Forneça nome, aparência, uma peculiaridade de personalidade e um segredo. Responda em Português formatado em Markdown.`,
  });
  return response.text;
}

export async function explainRule(query: string) {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Como mestre do sistema 'Devoradores de Alma' (inspirado em Soul Eater e sistema 2d6), responda a seguinte dúvida mecânica: ${query}`,
    config: {
      systemInstruction: "Você é um mestre de RPG experiente. O sistema usa 2d6. O sucesso total é 10+, parcial 7-9. Use termos como 'Ressonância de Alma' e 'Comprimento de Onda'."
    }
  });
  return response.text;
}

export async function generateMapScenario(userPrompt: string) {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Crie um layout de mapa para um RPG de mesa top-down baseado na descrição do usuário: "${userPrompt}". O grid é 60x34 (X de 0 a 59, Y de 0 a 33). Gere 'tokens' (objetos), 'walls' (paredes), e 'tileColors' (cores do chão) conforme o schema. Para áreas de água (rios, lagos), use 'tileColors' com a cor '#1e3a8a'. Para áreas de floresta ou grama, use 'tileColors' com a cor '#064e3b'.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          tokens: {
            type: Type.ARRAY,
            description: "Uma lista de objetos para colocar no mapa.",
            items: {
              type: Type.OBJECT,
              properties: {
                sourceId: {
                  type: Type.STRING,
                  description: "O tipo de objeto. Pode ser 'tree', 'rock', 'chest', 'table', 'chair', etc.",
                },
                x: {
                  type: Type.INTEGER,
                  description: "Coordenada X no grid (0-59).",
                },
                y: {
                  type: Type.INTEGER,
                  description: "Coordenada Y no grid (0-33).",
                },
              },
              required: ['sourceId', 'x', 'y']
            },
          },
          walls: {
            type: Type.ARRAY,
            description: "Uma lista de segmentos de parede. Use 'v-x-y' para vertical e 'h-x-y' para horizontal.",
            items: {
              type: Type.STRING,
            },
          },
          tileColors: {
            type: Type.ARRAY,
            description: "Uma lista de cores para pintar os tiles do chão.",
            items: {
              type: Type.OBJECT,
              properties: {
                x: {
                  type: Type.INTEGER,
                  description: "Coordenada X no grid (0-59).",
                },
                y: {
                  type: Type.INTEGER,
                  description: "Coordenada Y no grid (0-33).",
                },
                color: {
                  type: Type.STRING,
                  description: "Cor em formato hexadecimal (ex: #1e3a8a para água, #064e3b para floresta).",
                },
              },
              required: ['x', 'y', 'color'],
            },
          },
        },
      },
    },
  });
  
  try {
    const jsonStr = (response.text || '').trim();
    if (!jsonStr) {
      console.error("AI response was empty.");
      return null;
    }
    return JSON.parse(jsonStr);
  } catch (e) {
    console.error("Failed to parse AI response:", e);
    return null;
  }
}