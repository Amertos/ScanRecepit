import { GoogleGenAI, Type } from "@google/genai";
import type { ReceiptData, SpendingCategory, ChatMessage } from "../types";
import { SPENDING_CATEGORIES } from "../types";

const fileToGenerativePart = async (file: File) => {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result.split(',')[1]);
      } else {
        resolve(''); // Should not happen with readAsDataURL
      }
    };
    reader.readAsDataURL(file);
  });
  const base64EncodedData = await base64EncodedDataPromise;
  return {
    inlineData: {
      data: base64EncodedData,
      mimeType: file.type,
    },
  };
};

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

const receiptSchema = {
  type: Type.OBJECT,
  properties: {
    storeName: { type: Type.STRING, description: "The name of the store or vendor." },
    date: { type: Type.STRING, description: "The date of the transaction in YYYY-MM-DD format." },
    items: {
      type: Type.ARRAY,
      description: "A list of all items purchased.",
      items: {
        type: Type.OBJECT,
        properties: {
          description: { type: Type.STRING, description: "The name or description of the item." },
          price: { type: Type.NUMBER, description: "The price of the item." },
        },
        required: ["description", "price"],
      },
    },
    subtotal: { type: Type.NUMBER, description: "The subtotal amount before tax, if available. Otherwise calculate it." },
    tax: { type: Type.NUMBER, description: "The total tax amount, if available. Otherwise set to 0." },
    total: { type: Type.NUMBER, description: "The final total amount paid." },
    category: {
      type: Type.STRING,
      description: `The most appropriate spending category key for this receipt from the following list: ${SPENDING_CATEGORIES.join(', ')}.`,
      enum: SPENDING_CATEGORIES as any,
    },
    currency: {
        type: Type.STRING,
        description: "The currency symbol (e.g., $, €, RSD) or ISO 4217 code (e.g., USD, EUR, RSD) found on the receipt. Default to 'USD' if not found."
    }
  },
  required: ["storeName", "date", "items", "total", "category", "currency"],
};

export const analyzeReceiptImage = async (imageFile: File): Promise<Omit<ReceiptData, 'id' | 'insight'>> => {
  const imagePart = await fileToGenerativePart(imageFile);
  const prompt = "Analyze this receipt image. Extract all relevant information and provide it in the requested JSON format. If a value like tax or subtotal is not explicitly present, calculate it or set it to 0. Select the most fitting category key.";

  const result = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: { parts: [imagePart, { text: prompt }] },
    config: {
        responseMimeType: "application/json",
        responseSchema: receiptSchema,
    }
  });

  const jsonText = result.text.trim();
  const parsedData = JSON.parse(jsonText) as Omit<ReceiptData, 'id' | 'insight'>;

  // Ensure the category is a valid one, otherwise default to 'other'
  if (!SPENDING_CATEGORIES.includes(parsedData.category)) {
      parsedData.category = 'other';
  }

  return parsedData;
};


export const generateInsight = async (receiptData: Omit<ReceiptData, 'id' | 'insight'>, language: string): Promise<string> => {
    const prompt = `Based on the following receipt data, provide a short, friendly, and insightful comment about the spending. Respond in the language with this code: ${language}. Focus on a single interesting aspect. Keep it under 25 words. For example: "Looks like a delicious meal at ${receiptData.storeName}!" or "Stocking up on essentials is always a good idea.". Receipt data: ${JSON.stringify(receiptData)}`;

    const result = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt
    });

    return result.text.trim();
};

export const generateWeeklyAnalysis = async (allReceipts: ReceiptData[], language: string): Promise<string> => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const recentReceipts = allReceipts.filter(r => new Date(r.date) >= oneWeekAgo);

    if (recentReceipts.length < 2) {
        // Fallback message is now handled by the component via translation key
        return "dashboard.weeklySummaryNotEnoughData";
    }

    const prompt = `Here are my expenses from the last 7 days: ${JSON.stringify(recentReceipts)}. 
    Provide a concise analysis of my spending habits. Respond in the language with this code: ${language}.
    The response should be a single string with newlines (\\n).
    
    Structure your response like this:
    - Start with a friendly summary sentence.
    - Use a heading **Spending Breakdown:** and then a short bulleted list of the top 2-3 spending categories.
    - Use a heading **Smart Savings Tip:** and then provide one actionable tip for saving money based on the data.
    
    Keep the entire response under 70 words.`;

    const result = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt
    });

    return result.text.trim();
};

export const generateChatTitle = async (conversation: string, language: string): Promise<string> => {
    const prompt = `Based on the following conversation start, create a very short, concise title (4 words max). Respond only with the title text, nothing else. Respond in the language with this code: ${language}. Conversation: ${conversation}`;
    
    const result = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
    });

    return result.text.trim().replace(/"/g, ''); // Clean up potential quotes
}