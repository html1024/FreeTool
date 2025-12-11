import { loadHighlightJs } from '../utils/loadHighlightJs';

// Language mapping from display names to Highlight.js language identifiers
const LANGUAGE_MAP: Record<string, string> = {
    "Python": "python",
    "JavaScript": "javascript",
    "HTML": "html",
    "CSS": "css",
    "SQL": "sql",
    "TypeScript": "typescript",
    "JSX": "jsx",
    "JSON": "json",
    "Markdown": "markdown",
    "Go": "go",
    "Rust": "rust",
    "Java": "java",
    "C++": "cpp"
};

export async function highlightCode(code: string, language: string): Promise<string> {
    // 按需加载 Highlight.js
    await loadHighlightJs();

    // Ensure Highlight.js is loaded
    if (!window.hljs) {
        throw new Error("Highlight.js 未加载。请刷新页面重试。");
    }

    try {
        const languageCode = LANGUAGE_MAP[language] || language.toLowerCase();

        // Use Highlight.js to highlight the code
        const result = window.hljs.highlight(code, {
            language: languageCode,
            ignoreIllegals: true
        });

        // Return the highlighted HTML
        return result.value;
    } catch (error) {
        console.error("Error highlighting code:", error);
        // Fallback: escape HTML and return as plain text
        const escapedCode = code
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
        return escapedCode;
    }
}
