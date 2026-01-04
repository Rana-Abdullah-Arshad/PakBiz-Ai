
import { GoogleGenAI, Type } from "@google/genai";
import { AIConfig } from "../types";
import { securityService } from "./securityService";

export class AiService {
  private config: AIConfig;
  private adminSecret: string;

  constructor(config: AIConfig, adminSecret: string) {
    this.config = config;
    this.adminSecret = adminSecret;
  }

  /**
   * Internal helper to get a ready-to-use API key
   */
  private async getDecryptedKey(): Promise<string> {
    if (this.config.provider === 'gemini') return process.env.API_KEY || '';
    if (!this.config.customApiKey) return '';
    
    // Decrypt the key using the platform's adminSecret
    return await securityService.decrypt(this.config.customApiKey, this.adminSecret);
  }

  async generateContent(prompt: string, systemInstruction: string) {
    const activeKey = await this.getDecryptedKey();

    if (this.config.provider === 'gemini') {
      const ai = new GoogleGenAI({ apiKey: activeKey });
      const response = await ai.models.generateContent({
        model: this.config.model || 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });
      return response.text;
    } else {
      return this.externalProviderCall(prompt, systemInstruction, activeKey);
    }
  }

  async verifyPayment(
    base64Image: string, 
    mimeType: string, 
    inputTID: string, 
    expectedAmount: number,
    platformDetails: { jazzCash: string, easypaisa: string, bank: string }
  ) {
    const activeKey = await this.getDecryptedKey();
    const currentDateObj = new Date();
    const currentDateStr = currentDateObj.toLocaleDateString('en-GB');
    const currentISO = currentDateObj.toISOString();

    const prompt = `
      As a specialized Payment Audit AI for a Pakistani SaaS platform, verify this payment receipt. 
      STRICT VERIFICATION PARAMETERS:
      - System Time: ${currentISO}
      - User TID: "${inputTID}"
      - Expected Amount: PKR ${expectedAmount}
      - Authorized Accounts: JazzCash(${platformDetails.jazzCash}), Easypaisa(${platformDetails.easypaisa}), Bank(${platformDetails.bank})

      TASK:
      1. Extract TID. Match with "${inputTID}"?
      2. Match receiver with authorized accounts.
      3. Match amount. Must be EXACTLY PKR ${expectedAmount} or more.
      4. Date check: Fail if >48 hours old.

      OUTPUT FORMAT (JSON ONLY):
      {
        "isValid": boolean,
        "reason": "explanation",
        "extractedTID": "string",
        "extractedAmount": number,
        "extractedDate": "string"
      }
    `;

    if (this.config.provider === 'gemini') {
      const ai = new GoogleGenAI({ apiKey: activeKey });
      const response = await ai.models.generateContent({
        model: this.config.model || 'gemini-3-flash-preview',
        contents: {
          parts: [
            { text: prompt },
            { inlineData: { data: base64Image, mimeType: mimeType } }
          ]
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              isValid: { type: Type.BOOLEAN },
              reason: { type: Type.STRING },
              extractedTID: { type: Type.STRING },
              extractedAmount: { type: Type.NUMBER },
              extractedDate: { type: Type.STRING }
            },
            required: ["isValid", "reason", "extractedTID", "extractedAmount", "extractedDate"],
          }
        }
      });
      return JSON.parse(response.text || '{}');
    } else {
      return this.externalProviderCall(prompt, "Respond only in JSON.", activeKey, true, base64Image, mimeType);
    }
  }

  private async externalProviderCall(
    prompt: string, 
    systemInstruction: string, 
    apiKey: string,
    isVision: boolean = false, 
    base64Image?: string, 
    mimeType?: string
  ) {
    const endpoints: Record<string, string> = {
      openai: 'https://api.openai.com/v1/chat/completions',
      openrouter: 'https://openrouter.ai/api/v1/chat/completions',
      deepseek: 'https://api.deepseek.com/chat/completions'
    };

    if (!apiKey) throw new Error(`${this.config.provider.toUpperCase()} API Key is missing or incorrectly decrypted.`);

    const messages = [];
    if (systemInstruction) messages.push({ role: 'system', content: systemInstruction });
    
    if (isVision && base64Image) {
      messages.push({
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          {
            type: 'image_url',
            image_url: { url: `data:${mimeType};base64,${base64Image}` }
          }
        ]
      });
    } else {
      messages.push({ role: 'user', content: prompt });
    }

    try {
      const response = await fetch(endpoints[this.config.provider as keyof typeof endpoints], {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          ...(this.config.provider === 'openrouter' ? { 'HTTP-Referer': window.location.origin } : {})
        },
        body: JSON.stringify({
          model: this.config.model,
          messages,
          response_format: { type: 'json_object' }
        })
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error.message);
      
      const content = data.choices[0].message.content;
      return typeof content === 'string' ? JSON.parse(content) : content;
    } catch (error: any) {
      console.error("AI Provider Error:", error);
      throw new Error(`AI Request Failed: ${error.message}`);
    }
  }

  static getPrompts(type: 'caption' | 'whatsapp' | 'offer') {
    const systemInstructions = {
      caption: "Professional social media marketing for Pakistani businesses. Write Engaging Roman Urdu/English captions.",
      whatsapp: "Master WhatsApp sales closer for Pakistan. Persuasive Roman Urdu/English scripts.",
      offer: "Creative strategist. Irresistible offers for Pakistani market (e.g. Buy1Get1)."
    };
    return systemInstructions[type];
  }
}
