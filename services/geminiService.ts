
import { GoogleGenAI } from "@google/genai";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

export async function highlightCode(code: string, language: string): Promise<string> {
    const prompt = `
You are an expert code syntax highlighter. Your task is to convert a raw code snippet into an HTML string with syntax highlighting using Tailwind CSS classes.

Instructions:
1.  Analyze the provided ${language} code.
2.  Wrap different tokens (keywords, strings, comments, etc.) in \`<span>\` tags.
3.  Apply appropriate Tailwind CSS utility classes for colors. Use colors that are visible in both light and dark modes (e.g., \`text-blue-600 dark:text-blue-400\`).
4.  Do NOT include any parent elements like \`<pre>\` or \`<code>\`. The output must be only the series of \`<span>\` tags and raw text.
5.  Preserve all original whitespace, indentation, and newlines.

Example for JavaScript:
-   Keywords (\`const\`, \`function\`): \`text-purple-600 dark:text-purple-400\`
-   Strings: \`text-green-600 dark:text-green-400\`
-   Numbers: \`text-amber-600 dark:text-amber-400\`
-   Comments: \`text-gray-500 dark:text-gray-400\`
-   Function/variable names: \`text-blue-600 dark:text-blue-400\`
-   Punctuation: \`text-gray-700 dark:text-gray-300\`

Code to highlight:
\`\`\`${language}
${code}
\`\`\`
`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        // Replace newlines with <br> for HTML rendering inside <pre>
        const rawHtml = response.text.trim();
        return rawHtml.replace(/\n/g, '<br/>');

    } catch (error) {
        console.error("Error calling Gemini API:", error);
        throw new Error("从 AI 获取响应失败。请查看控制台获取详细信息。");
    }
}
