/** 将料理事实转换为面向不同模型的精简中文提示词。 */
import { cuisineScores, processingChain, processingTagSummary } from './cooking'
import { platingRoleLabel } from './data/plating'
import type { ProcessedItem } from './types'

function cuisineLine(items: ProcessedItem[]) {
  const scores = cuisineScores(items).slice(0, 3)
  return scores.length > 0
    ? scores.map(({ name, score }) => `${name} ${score}`).join('，')
    : '自由融合'
}

function itemFacts(item: ProcessedItem) {
  const role = item.platingRole ? `\n  用途：${platingRoleLabel(item.platingRole)}` : ''
  return `- ${item.title}\n  组成：${item.ingredients.map((ingredient) => ingredient.name).join('、')}\n  加工：${processingChain(item)}\n  状态：${processingTagSummary(item)}${role}`
}

/** 生成只包含成品画面所需事实的图片模型提示词。 */
export function buildImagePrompt(items: ProcessedItem[]) {
  const facts = items.map(itemFacts).join('\n') || '- 尚无料理'
  return `生成一张写实的成品料理图片。\n\n料理：\n${facts}\n\n菜系倾向：${cuisineLine(items)}\n\n真实食物质感，自然餐桌光线，近景构图，画面中不出现文字、人物、包装或品牌标志。`
}

/** 生成供料理评价模型理解组成和加工顺序的事实上下文。 */
export function buildEvaluationPrompt(items: ProcessedItem[]) {
  const facts = items.map(itemFacts).join('\n') || '- 尚无料理'
  return `料理：\n${facts}\n\n菜系倾向：${cuisineLine(items)}\n\n评价这道料理的完成度、味道和质地。`
}
