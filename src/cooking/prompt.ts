/** 将当前料理状态转换为面向不同模型的中文提示词。 */
import { cuisineScores, dishSensory, sensorySummary, stepResults, stepTitle } from './cooking'
import { operations } from './data/operations'
import type { CookingStep, ProcessedItem } from './types'

const shapeOperationIds = new Set([
  'halved', 'sliced', 'strips', 'diced', 'chunks', 'minced', 'grated',
  'flattened', 'rolled', 'crushed', 'ground', 'paste', 'skewered', 'shaped',
])

/** 保持描述顺序，并去掉合并加工历史中可能出现的重复文本。 */
function uniqueDescriptions(descriptions: string[]) {
  return [...new Set(descriptions)]
}

/** 返回某种食材参与的步骤。 */
function ingredientSteps(item: ProcessedItem, ingredientName: string) {
  return item.history.filter((step) => step.activeNames.includes(ingredientName))
}

/** 从加工历史中提取生图模型需要的单种食材视觉状态。 */
function visualState(steps: CookingStep[], ingredientName: string) {
  const shapeSteps = steps.filter((step) => shapeOperationIds.has(step.operationId))
  const heatedSteps = steps.filter((step) => operations[step.operationId]?.kind === 'progressive')
  const targetedHeatingSteps = heatedSteps.filter((step) => step.levelsByName[ingredientName] !== null)
  const otherSteps = steps.filter((step) => {
    const operation = operations[step.operationId]
    return operation?.kind === 'instant' && !shapeOperationIds.has(step.operationId)
  })
  const lastShape = shapeSteps.at(-1)?.appearancesByName[ingredientName]
  const lastHeating = targetedHeatingSteps.at(-1)?.appearancesByName[ingredientName]
  const assistedHeating = heatedSteps
    .filter((step) => step.levelsByName[ingredientName] === null)
    .map((step) => operations[step.operationId]?.label)
    .filter((label): label is string => Boolean(label))
  const otherDescriptions = uniqueDescriptions(otherSteps.map((step) => step.appearancesByName[ingredientName]))

  return {
    shape: lastShape ?? '保持原始形态，未切配或塑形',
    doneness: lastHeating
      ?? (assistedHeating.length > 0
        ? `未单独记录熟度，作为辅助成分参与${uniqueDescriptions(assistedHeating).join('、')}`
        : '未经过加热烹饪'),
    other: otherDescriptions.join('；') || '无其他操作',
  }
}

/** 返回最多三项菜系倾向。 */
function cuisineLines(items: ProcessedItem[]) {
  return cuisineScores(items).slice(0, 3).map(({ name, score }, index) =>
    `- ${name}：${['强', '中等', '轻微'][index]}（${score}分）`,
  )
}

/** 生成只关注可见状态和画面表现的图片模型提示词。 */
export function buildImagePrompt(items: ProcessedItem[]) {
  const itemLines = items.map((item) => {
    const ingredients = item.ingredients.map((ingredient) => {
      const state = visualState(ingredientSteps(item, ingredient.name), ingredient.name)
      return `  - ${ingredient.name}\n    物理外形：${state.shape}\n    烹饪程度：${state.doneness}\n    其他操作：${state.other}`
    }).join('\n')
    return `- ${item.title}\n  组成及可见状态：\n${ingredients}`
  })
  const cuisines = cuisineLines(items)

  return `生成一张沉浸式、写实的成品料理图片。\n\n料理中的已处理食材：\n${itemLines.join('\n') || '- 尚未处理食材'}\n\n菜系倾向：\n${cuisines.join('\n') || '- 自由融合'}\n\n画面要求：\n- 将全部已处理食材自然组合成一份完整、可食用的菜品\n- 准确呈现每种食材的物理外形、烹饪程度和表面状态\n- 根据菜系倾向选择合理的摆盘和餐桌语境\n- 自然餐桌光线，真实食物质感，近景构图\n- 画面中不出现文字、人物、包装或品牌标志`
}

/** 生成包含完整加工过程、口味与感官信息的料理评价上下文。 */
export function buildEvaluationPrompt(items: ProcessedItem[]) {
  const sensory = dishSensory(items)
  const itemLines = items.map((item) => {
    const steps = item.history.map((step, index) => {
      const results = stepResults(step).map((result) => `       ${result}`).join('\n')
      return `    ${index + 1}. ${stepTitle(step)}\n${results}`
    }).join('\n')
    return `- ${item.title}\n  组成：${item.ingredients.map((ingredient) => ingredient.name).join('、')}\n  加工顺序：\n${steps || '    无加工记录'}\n  口味与感官：${sensorySummary(item.sensory)}`
  })
  const cuisines = cuisineLines(items)

  return `以下是当前料理的完整上下文，供料理评价模型使用。\n\n已处理食材：\n${itemLines.join('\n') || '- 尚未处理食材'}\n\n整体口味与感官：\n- ${sensorySummary(sensory)}\n\n菜系倾向：\n${cuisines.join('\n') || '- 自由融合'}`
}
