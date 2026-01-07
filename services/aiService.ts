
import { GoogleGenAI, Type } from "@google/genai";
import { AIConfig } from "../types";
import { securityService } from "./securityService";

export class AiService {
  private config: AIConfig;
  private signingSecret: string;
  private userKey?: string;

  constructor(config: AIConfig, signingSecret: string, userKey?: string) {
    this.config = config;
    this.signingSecret = signingSecret;
    this.userKey = userKey;
  }

  /**
   * Generates content using the configured provider.
   * Priority: userKey > encrypted platform key > process.env.API_KEY
   */
  async generateContent(prompt: string, systemInstruction: string) {
    if (this.config.provider === 'gemini') {
      const apiKey = this.userKey || process.env.API_KEY;
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: this.config.model || 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          systemInstruction,
          temperature: this.config.temperature || 0.7,
          topP: this.config.topP || 0.95,
          thinkingConfig: this.config.thinkingBudget ? { thinkingBudget: this.config.thinkingBudget } : undefined
        },
      });
      return response.text;
    } else {
      return this.externalProviderCall(prompt, systemInstruction);
    }
  }

  /**
   * Verified payment screenshot using vision and reasoning.
   */
  async verifyPayment(
    base64Image: string, 
    mimeType: string, 
    inputTID: string, 
    expectedAmount: number,
    platformDetails: { jazzCash: string, easypaisa: string, bank: string }
  ) {
    const currentISO = new Date().toISOString();
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

    // Payment verification always uses system key for platform security
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
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
  }

  private async externalProviderCall(
    prompt: string, 
    systemInstruction?: string,
    isVision: boolean = false, 
    base64Image?: string, 
    mimeType?: string
  ) {
    const endpoints: Record<string, string> = {
      openai: 'https://api.openai.com/v1/chat/completions',
      openrouter: 'https://openrouter.ai/api/v1/chat/completions',
      deepseek: 'https://api.deepseek.com/chat/completions'
    };

    // Use userKey if available, else decrypt platform key, else fallback to env
    let apiKey = this.userKey || process.env.API_KEY; 
    
    if (!this.userKey && this.config.apiKey) {
      try {
        apiKey = await securityService.decrypt(this.config.apiKey, this.signingSecret);
      } catch (e) {
        console.error("Failed to decrypt Provider Key");
      }
    }

    const messages = [];
    if (systemInstruction || this.config.systemInstruction) {
      messages.push({ role: 'system', content: systemInstruction || this.config.systemInstruction });
    }
    
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
        },
        body: JSON.stringify({
          model: this.config.model,
          messages,
          temperature: this.config.temperature || 0.7,
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || "AI Provider Error");
      
      const content = data.choices[0].message.content;
      return content;
    } catch (error: any) {
      console.error("External AI Provider Error:", error);
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
