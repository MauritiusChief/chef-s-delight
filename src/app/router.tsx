import { createBrowserRouter } from 'react-router-dom'
import { DebugPromptPage } from '../pages/DebugPromptPage'
import { HomePage } from '../pages/HomePage'
import { NotFoundPage } from '../pages/NotFoundPage'

export const router = createBrowserRouter([
  { path: '/', element: <HomePage /> },
  { path: '/debug/prompt', element: <DebugPromptPage /> },
  { path: '*', element: <NotFoundPage /> },
])
