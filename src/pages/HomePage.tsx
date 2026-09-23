import { Link } from 'react-router-dom'

export function HomePage() {
  return (
    <main className="home-page">
      <p className="eyebrow">Chef&apos;s Delight</p>
      <h1>料理游戏开发中</h1>
      <p>这里暂时是游戏首页的占位页面。</p>
      <Link className="button-link" to="/debug/prompt">打开烹饪提示词调试器</Link>
    </main>
  )
}
