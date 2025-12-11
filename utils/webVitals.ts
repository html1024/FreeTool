import { onCLS, onINP, onFCP, onLCP, onTTFB, type Metric } from 'web-vitals';

// 性能指标阈值
const THRESHOLDS = {
  CLS: { good: 0.1, needsImprovement: 0.25 },
  INP: { good: 200, needsImprovement: 500 },
  FCP: { good: 1800, needsImprovement: 3000 },
  LCP: { good: 2500, needsImprovement: 4000 },
  TTFB: { good: 800, needsImprovement: 1800 },
};

// 判断性能等级
function getRating(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  const threshold = THRESHOLDS[name as keyof typeof THRESHOLDS];
  if (!threshold) return 'poor';

  if (value <= threshold.good) return 'good';
  if (value <= threshold.needsImprovement) return 'needs-improvement';
  return 'poor';
}

// 发送性能指标到控制台（可以改为发送到分析服务）
function sendToAnalytics(metric: Metric) {
  const rating = getRating(metric.name, metric.value);
  const emoji = rating === 'good' ? '✅' : rating === 'needs-improvement' ? '⚠️' : '❌';

  console.log(`${emoji} ${metric.name}: ${metric.value.toFixed(2)} (${rating})`);

  // 可以在这里发送到 Google Analytics 或其他分析服务
  if (window.gtag) {
    window.gtag('event', metric.name, {
      value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
      event_category: 'Web Vitals',
      event_label: metric.id,
      non_interaction: true,
    });
  }
}

// 初始化 Web Vitals 监控
export function initWebVitals() {
  onCLS(sendToAnalytics);
  onINP(sendToAnalytics); // INP 替代了 FID
  onFCP(sendToAnalytics);
  onLCP(sendToAnalytics);
  onTTFB(sendToAnalytics);

  console.log('🚀 Web Vitals 性能监控已启动');
}

// 声明 gtag 类型
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}
