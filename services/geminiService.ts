
import { GoogleGenAI, Type } from "@google/genai";

export class GeminiService {
  private ai: GoogleGenAI;

  /**
   * Always obtain the API key exclusively from process.env.API_KEY || 'FAKE_API_KEY_FOR_DEVELOPMENT'.
   * Do not allow passing an external key as per security guidelines.
   */
  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY || 'FAKE_API_KEY_FOR_DEVELOPMENT' });
  }

  /**
   * Generates content using gemini-3-flash-preview.
   * Accesses .text property directly.
   */
  async generateContent(prompt: string, systemInstruction: string) {
    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });
      return response.text;
    } catch (error) {
      console.error("Gemini Error:", error);
      throw error;
    }
  }

  /**
   * Verified payment screenshot using vision and reasoning.
   * Employs responseSchema for structured JSON output.
   */
  async verifyPayment(
    base64Image: string, 
    mimeType: string, 
    inputTID: string, 
    expectedAmount: number,
    platformDetails: { jazzCash: string, easypaisa: string, bank: string }
  ) {
    const currentDate = new Date().toLocaleDateString('en-GB'); // Current date in DD/MM/YYYY
    const currentISO = new Date().toISOString();

    const prompt = `
      As a Payment Auditor for a Pakistani SaaS platform, verify this payment screenshot strictly.
      
      CONTEXT:
      - Current Date (Server Time): ${currentDate} (${currentISO})
      - User Input Transaction ID (TID): ${inputTID}
      - Expected Amount to be paid: PKR ${expectedAmount}
      
      PLATFORM AUTHORIZED ACCOUNTS:
      - JazzCash: ${platformDetails.jazzCash}
      - Easypaisa: ${platformDetails.easypaisa}
      - Bank Account: ${platformDetails.bank}

      TASK:
      1. Extract the Transaction ID (TID) from the image. Does it match exactly with "${inputTID}"?
      2. Identify the receiver's account number or name in the image. Does it match any of the Platform Authorized Accounts?
      3. Extract the amount paid. Does it match exactly or exceed ${expectedAmount}?
      4. Check the transaction date on the slip:
         - If the date is 2 days or more BEFORE ${currentDate}, reject it.
         - If the date is in the FUTURE relative to ${currentDate}, reject it.
         - Dates should be within 48 hours of now.
    `;

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
          parts: [
            { text: prompt },
            {
              inlineData: {
                data: base64Image,
                mimeType: mimeType
              }
            }
          ]
        },
        config: {
          responseMimeType: "application/json",
          // Recommended configuration for reliable JSON output
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              isValid: {
                type: Type.BOOLEAN,
                description: 'Whether the payment is deemed valid based on evidence.'
              },
              reason: {
                type: Type.STRING,
                description: 'Explanation for the verification decision.'
              },
              extractedTID: {
                type: Type.STRING,
                description: 'The TID extracted from the slip.'
              },
              extractedAmount: {
                type: Type.NUMBER,
                description: 'The amount extracted from the slip.'
              },
              extractedDate: {
                type: Type.STRING,
                description: 'The transaction date extracted from the slip.'
              }
            },
            required: ["isValid", "reason", "extractedTID", "extractedAmount", "extractedDate"],
          }
        }
      });

      // Directly access .text property from response
      const result = JSON.parse(response.text || '{}');
      return result;
    } catch (error) {
      console.error("Payment Verification Error:", error);
      throw new Error("Unable to verify payment. Please ensure the screenshot is clear and shows TID, Amount, and Receiver details.");
    }
  }

  static getPrompts(type: 'caption' | 'whatsapp' | 'offer') {
    const systemInstructions = {
      caption: "You are a professional social media marketing expert for Pakistani businesses. Write engaging captions in a mix of Urdu and English (Roman Urdu).",
      whatsapp: "You are a master of WhatsApp sales closing in Pakistan. Write persuasive scripts in Roman Urdu and English.",
      offer: "You are a creative business strategist. Create Irresistible offers for Pakistani customers like 'Buy 1 Get 1' or 'Free Delivery'."
    };
    return systemInstructions[type];
  }
}
