/** 烹饪领域规则：处理兼容性、加工事实、粗粒度标签和菜系倾向。 */
import { ingredients, profileLabels, tools } from './data/catalog'
import { operations } from './data/operations'
import { ingredientCuisine, ingredientTraits, profileTraits } from './data/properties'
import type {
  BatchInput,
  CookingStep,
  CuisineCalculation,
  CuisineScore,
  Ingredient,
  Operation,
  ProcessedItem,
  ProcessingTags,
  ProfileId,
  ScoreMap,
} from './types'

const roleLabels: Partial<Record<ProfileId, string>> = {
  fat: '烹饪油脂',
  liquid: '液体',
  seasoning: '调味',
  spice: '香辛料',
  aromatic: '芳香配料',
}

/** 五档只表达本次加工的程度，不预判加工结果好坏。 */
export const progressLabels = ['短暂', '轻度', '常规', '充分', '深度'] as const

export function progressLabel(level: number | null) {
  const safeLevel = Math.max(0, Math.min(4, Math.round(level ?? 0)))
  return progressLabels[safeLevel]
}

function addMap(target: ScoreMap, source: ScoreMap | undefined) {
  Object.entries(source ?? {}).forEach(([key, value]) => {
    if (value !== undefined) target[key] = (target[key] ?? 0) + value
  })
}

/** 根据食材大类返回其在加工批次中的作用。 */
export function roleFor(profile: ProfileId) {
  return roleLabels[profile] ?? '主体食材'
}

/** 取得已处理食材的首个主体大类，供后续兼容性判断使用。 */
export function itemPrimaryProfile(item: ProcessedItem) {
  return item.ingredients.find((ingredient) => roleFor(ingredient.profile) === '主体食材')?.profile
    ?? item.ingredients[0]?.profile
}

/** 合并食材大类物理特征与具体食材覆盖值。 */
function ingredientFeatureScores(ingredient: Ingredient) {
  return { ...profileTraits[ingredient.profile], ...ingredientTraits[ingredient.name] }
}

/** 判断基础食材是否是 operation 实际加工的主体。 */
function isIngredientTarget(operation: Operation, ingredient: Ingredient) {
  return operation.profiles.includes(ingredient.profile)
    || operation.targetTraits?.some((trait) => (ingredientFeatureScores(ingredient)[trait] ?? 0) > 0)
    || false
}

function isInputTarget(operation: Operation, input: BatchInput) {
  return operation.profiles.includes(input.profile)
    || input.ingredients.some((ingredient) => isIngredientTarget(operation, ingredient))
}

/** 判断批次投入是否会被指定 operation 作为主体加工。 */
export function isOperationTargetInput(operationId: string, input: BatchInput) {
  const operation = operations[operationId]
  return operation ? isInputTarget(operation, input) : false
}

/** 返回 operation 对当前批次的首个不满足原因；空批次暂不参与过滤。 */
export function operationUnavailableReason(operationId: string, inputs: BatchInput[]) {
  const operation = operations[operationId]
  if (!operation) return '未知操作'
  if (inputs.length === 0) return null

  if (!inputs.some((input) => isInputTarget(operation, input))) return '缺少可加工的主体食材'

  const ingredientsInBatch = inputs.flatMap((input) => input.ingredients)
  const missing = operation.requirements?.find((requirement) => {
    if (requirement.kind === 'profile') {
      return !ingredientsInBatch.some((ingredient) => requirement.profiles.includes(ingredient.profile))
    }
    return !ingredientsInBatch.some((ingredient) =>
      (ingredientFeatureScores(ingredient)[requirement.trait] ?? 0) >= requirement.minimum,
    )
  })
  return missing?.label ?? null
}

export function isOperationAvailable(operationId: string, inputs: BatchInput[]) {
  return operationUnavailableReason(operationId, inputs) === null
}

export function createRawInput(name: string, level: number | null): BatchInput {
  const ingredient = ingredients.find((candidate) => candidate.name === name)
  if (!ingredient) throw new Error(`未知食材：${name}`)
  return {
    kind: 'raw',
    key: `raw:${name}`,
    label: name,
    profile: ingredient.profile,
    ingredients: [ingredient],
    history: [],
    level,
  }
}

export function createProcessedInput(item: ProcessedItem, level: number | null): BatchInput {
  const profile = itemPrimaryProfile(item)
  if (!profile) throw new Error('已处理食材没有组成')
  return {
    kind: 'item',
    key: `item:${item.id}`,
    label: item.title,
    profile,
    ingredients: item.ingredients,
    history: item.history,
    itemId: item.id,
    level,
  }
}

/** 按食材名称去重，同时保留第一次出现的顺序。 */
function uniqueIngredients(list: Ingredient[]) {
  const seen = new Set<string>()
  return list.filter((ingredient) => {
    if (seen.has(ingredient.name)) return false
    seen.add(ingredient.name)
    return true
  })
}

/** 执行一个批次，消费其输入并生成只包含事实历史的新产物。 */
export function processBatch(inputs: BatchInput[], toolId: string, operationId: string, id: number) {
  if (inputs.length === 0) throw new Error('加工批次不能为空')
  const operation = operations[operationId]
  if (!operation) throw new Error(`未知操作：${operationId}`)
  const tool = tools.find((candidate) => candidate.id === toolId)
  if (!tool) throw new Error(`未知厨具：${toolId}`)
  if (!tool.operationIds.includes(operationId)) throw new Error(`${tool.name}不能执行${operation.label}`)
  const unavailableReason = operationUnavailableReason(operationId, inputs)
  if (unavailableReason) throw new Error(`${operation.label}不可用：${unavailableReason}`)

  const itemIngredients = uniqueIngredients(inputs.flatMap((input) => input.ingredients))
  const levelsByName: Record<string, number | null> = {}
  inputs.forEach((input) => input.ingredients.forEach((ingredient) => {
    levelsByName[ingredient.name] = operation.kind === 'progressive' && isIngredientTarget(operation, ingredient)
      ? input.level
      : null
  }))

  const step: CookingStep = {
    toolId,
    operationId,
    levelsByName,
    activeNames: itemIngredients.map((ingredient) => ingredient.name),
  }
  const titleParts = itemIngredients.map((ingredient) => ingredient.name)
  const title = titleParts.length > 1
    ? `混合物（${titleParts.slice(0, 3).join('、')}${titleParts.length > 3 ? '等' : ''}）`
    : titleParts[0]
  return {
    id,
    title,
    ingredients: itemIngredients,
    history: [...inputs.flatMap((input) => input.history), step],
    platingRole: null,
  }
}

/** 从加工事实中给出三个产物级提示标签，不参与玩法评分。 */
export function processingTags(item: Pick<ProcessedItem, 'history'>): ProcessingTags {
  const heatSteps = item.history.flatMap((step) => {
    const operation = operations[step.operationId]
    if (operation?.kind !== 'progressive') return []
    const levels = step.activeNames
      .map((name) => step.levelsByName[name])
      .filter((level): level is number => level !== null && level !== undefined)
    return levels.length > 0 ? [{ operation, maximum: Math.max(...levels) }] : []
  })
  const drySteps = heatSteps.filter(({ operation }) => operation.heat === 'dry')
  const highestHeat = heatSteps.length > 0 ? Math.max(...heatSteps.map(({ maximum }) => maximum)) : null
  const highestDry = drySteps.length > 0 ? Math.max(...drySteps.map(({ maximum }) => maximum)) : null
  const latestHeat = heatSteps.at(-1)?.operation.heat

  return {
    doneness: highestHeat === null ? '未加热' : progressLabel(highestHeat),
    surface: highestDry === null ? '无' : progressLabel(highestDry),
    moisture: latestHeat === 'wet' ? '偏湿润' : latestHeat === 'dry' ? '偏干爽' : '未体现',
  }
}

export function processingTagSummary(item: Pick<ProcessedItem, 'history'>) {
  const tags = processingTags(item)
  return `熟化程度：${tags.doneness}；表面程度：${tags.surface}；含水倾向：${tags.moisture}`
}

/** 把事实历史压缩成供模型阅读的加工链。 */
export function processingChain(item: Pick<ProcessedItem, 'history'>) {
  const descriptions = item.history.map((step) => {
    const operation = operations[step.operationId]
    if (!operation) return step.operationId
    if (operation.kind === 'instant') return operation.label

    const targets = step.activeNames.flatMap((name) => {
      const level = step.levelsByName[name]
      return level === null || level === undefined ? [] : [{ name, label: progressLabel(level) }]
    })
    const distinctLevels = new Set(targets.map((target) => target.label))
    const detail = targets.length > 1 && distinctLevels.size > 1
      ? targets.map(({ name, label }) => `${name}：${label}`).join('、')
      : targets[0]?.label
    return detail ? `${operation.label}（${detail}）` : operation.label
  })

  const compressed: string[] = []
  descriptions.forEach((description) => {
    const previous = compressed.at(-1)
    const match = previous?.match(/^(.*?)(?: ×(\d+))?$/)
    if (match?.[1] === description) {
      compressed[compressed.length - 1] = `${description} ×${Number(match[2] ?? 1) + 1}`
    } else {
      compressed.push(description)
    }
  })
  return compressed.join(' → ') || '无'
}

/** 每种食材和厨具在整道菜中只提供一次菜系分数。 */
export function cuisineDetails(items: ProcessedItem[]): CuisineCalculation {
  const scores: ScoreMap = {}
  const seenIngredients = new Set<string>()
  const seenTools = new Set<string>()
  const itemCalculations = items.map((item) => {
    const contributions: CuisineCalculation['items'][number]['contributions'] = []
    item.ingredients.forEach((ingredient) => {
      if (seenIngredients.has(ingredient.name)) return
      seenIngredients.add(ingredient.name)
      const contribution = ingredientCuisine[ingredient.name] ?? {}
      if (Object.keys(contribution).length === 0) return
      contributions.push({ source: `食材：${ingredient.name}`, scores: contribution })
      addMap(scores, contribution)
    })
    item.history.forEach((step) => {
      if (seenTools.has(step.toolId)) return
      seenTools.add(step.toolId)
      const tool = tools.find((candidate) => candidate.id === step.toolId)
      if (!tool || Object.keys(tool.cuisine).length === 0) return
      contributions.push({ source: `厨具：${tool.name}`, scores: tool.cuisine })
      addMap(scores, tool.cuisine)
    })
    return { itemId: item.id, title: item.title, contributions }
  })
  const result: CuisineScore[] = Object.entries(scores)
    .map(([name, score]) => ({ name, score: score ?? 0 }))
    .sort((left, right) => right.score - left.score)
  return { items: itemCalculations, result }
}

export function cuisineScores(items: ProcessedItem[]): CuisineScore[] {
  return cuisineDetails(items).result
}

export function stepTitle(step: CookingStep) {
  const tool = tools.find((candidate) => candidate.id === step.toolId)
  return `${tool?.name ?? step.toolId} → ${operations[step.operationId]?.label ?? step.operationId}`
}

/** 将加工事件中的主体程度和辅助参与关系转换为调试文本。 */
export function stepResults(step: CookingStep) {
  const operation = operations[step.operationId]
  return step.activeNames.map((name) => {
    const ingredient = ingredients.find((candidate) => candidate.name === name)
    const targeted = operation && ingredient ? isIngredientTarget(operation, ingredient) : false
    if (!targeted) return `${name}：参与`
    if (operation?.kind === 'progressive') return `${name}：${progressLabel(step.levelsByName[name])}`
    return `${name}：主体`
  })
}
