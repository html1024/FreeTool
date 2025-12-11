// Highlight.js 按需加载工具
let highlightJsLoaded = false;

export const loadHighlightJs = async (): Promise<void> => {
  if (highlightJsLoaded || typeof window === 'undefined') {
    return;
  }

  // 检查是否已经加载
  if (window.hljs) {
    highlightJsLoaded = true;
    return;
  }

  // 等待 script 标签加载完成
  return new Promise((resolve) => {
    const checkInterval = setInterval(() => {
      if (window.hljs) {
        highlightJsLoaded = true;
        clearInterval(checkInterval);
        resolve();
      }
    }, 100);

    // 超时处理（10秒）
    setTimeout(() => {
      clearInterval(checkInterval);
      resolve();
    }, 10000);
  });
};

// 声明 window.hljs 类型
declare global {
  interface Window {
    hljs?: {
      highlightElement: (element: HTMLElement) => void;
      highlightAll: () => void;
    };
  }
}
