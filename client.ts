import OpenAI from "openai";
import { getApiKey, getPromptOptions } from "./config.js";
import { getConfig } from "./config_storage.js";

const openai = new OpenAI({
  apiKey: await getApiKey(),
});

export class ChatGPTClient {
  async getAnswer(question: string): Promise<string> {
    const { model, maxTokens, temperature } = await getPromptOptions();

    try {
      const result = await openai.chat.completions.create({
        model,
        messages: [
          {
            role: "user",
            content: question,
          },
        ],
      });
      return result.choices[0].message.content;
    } catch (e) {
      console.error(e?.response ?? e);
      throw e;
    }

    // @ts-ignore
  }
}
