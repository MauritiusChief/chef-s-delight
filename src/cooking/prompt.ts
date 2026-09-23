import { cuisineScores, dishSensory, sensorySummary, stepResults, stepTitle } from './cooking'
import type { ProcessedItem } from './types'

export function buildImagePrompt(items: ProcessedItem[]) {
  const sensory = dishSensory(items)
  const itemLines = items.map((item) => {
    const steps = item.history.map((step, index) => {
      const results = stepResults(step).map((result) => `       ${result}`).join('\n')
      return `    ${index + 1}. ${stepTitle(step)}\n${results}`
    }).join('\n')
    return `- ${item.title}\n  组成：${item.ingredients.map((ingredient) => ingredient.name).join('、')}\n  加工顺序：\n${steps}\n  感官：${sensorySummary(item.sensory)}`
  })
  const cuisines = cuisineScores(items).slice(0, 3).map(({ name, score }, index) =>
    `- ${name}：${['强', '中等', '轻微'][index]}（${score}分）`,
  )

  return `生成一张沉浸式、写实的成品料理图片。\n\n已处理食材：\n${itemLines.join('\n') || '- 尚未处理食材'}\n\n整体感官画像：\n- ${sensorySummary(sensory)}\n\n菜系倾向：\n${cuisines.join('\n') || '- 自由融合'}\n\n画面要求：\n- 将全部已处理食材自然组合成一份完整、可食用的菜品\n- 准确保留加工顺序、熟度、外观和质地\n- 自然餐桌光线，真实食物质感，近景构图\n- 画面中不出现文字、人物、包装或品牌标志`
}
