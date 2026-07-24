import Link from "next/link";
export default function NotFound() { return <main className="error-page"><div className="error-panel"><span>404 · NOT FOUND</span><h1>这页研究笔记还不存在</h1><p>链接可能已移动，或内容尚未发布。</p><Link className="button button-primary" href="/">返回首页</Link></div></main>; }
