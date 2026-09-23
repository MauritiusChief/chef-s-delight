/** 未匹配路由的兜底页面。 */
import { Link } from 'react-router-dom'
import '../styles/home.css'

/** 提示路径不存在并提供返回首页的入口。 */
export function NotFoundPage() {
  return (
    <main className="home-page">
      <h1>页面不存在</h1>
      <Link to="/">返回首页</Link>
    </main>
  )
}
