/** 项目占位首页，提供进入烹饪调试器的入口。 */
import { Link } from 'react-router-dom'
import '../styles/home.css'

/** 渲染游戏正式首页完成前的占位内容。 */
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
