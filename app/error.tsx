"use client";
export default function ErrorBoundary({ reset }: { error: Error & { digest?: string }; reset: () => void }) { return <main className="error-page"><div className="error-panel"><span>APPLICATION ERROR</span><h1>页面暂时无法加载</h1><p>数据服务或页面渲染遇到问题。没有使用替代数据。</p><button className="button button-primary" onClick={reset}>重试</button></div></main>; }
