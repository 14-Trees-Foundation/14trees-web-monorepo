import { ChatOpenAI } from "@langchain/openai";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";

const llm = new ChatOpenAI({ model: "gpt-4o", temperature: 0 });

const systemPrompt = `You are a helpful assistant that turns structured JSON data into beautiful HTML using the following design theme:
- Primary Color: green
- Secondary Color: brown

**Guidelines:**
- Use inline css to make it look morden UI
- Output clean, semantic HTML (no markdown).
- Style using inline styles only (no external CSS).
- Use primary color (green) for headings and borders.
- Use secondary color (brown) for accents like icons, labels, or highlights.
- Ensure good spacing, alignment, and font sizing.
- The html you generate, will be rendered in entier page/window so align it properly and make sure it's responsive.
- Avoid JavaScript, return only HTML content.
- Do not include explanations, return HTML only.
`;

export async function generateHtml(data: any): Promise<string> {
  const messages = [
    new SystemMessage(systemPrompt),
    new HumanMessage(`Here is the structured data:\n${JSON.stringify(data, null, 2)}`),
  ];

  const response = await llm.invoke(messages);

  let htmlStr = response.content.toString().trim();
  if (htmlStr.startsWith("```html")) htmlStr = htmlStr.substring(7);
  if (htmlStr.startsWith("```")) htmlStr = htmlStr.substring(4);
  if (htmlStr.endsWith("```")) htmlStr = htmlStr.slice(0, -3);

  return htmlStr.trim();
}
