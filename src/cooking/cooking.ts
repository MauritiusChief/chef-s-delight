/** 烹饪领域规则：处理兼容性、加工事件、感官、菜系和调试明细。 */
import { ingredients, operations, profileLabels, tools } from './data/catalog'
import { progressModels } from './data/progress'
import {
  ingredientCuisine,
  ingredientSensory,
  ingredientTraits,
  profileSensory,
  profileTraits,
  senseIds,
  senseLabels,
} from './data/sensory'
import type {
  BatchInput,
  CookingStep,
  CuisineCalculation,
  CuisineScore,
  DishSensoryCalculation,
  Ingredient,
  ProcessedItem,
  ProfileId,
  ScoreMap,
  SensoryCalculation,
  SenseId,
} from './types'

const dryHeat = new Set(['pan_fried', 'stir_fried', 'roasted', 'baked', 'grilled', 'deep_fried', 'toasted', 'caramelized', 'griddled'])
const wetHeat = new Set(['boiled', 'simmered', 'braised', 'poached', 'steamed'])

const roleLabels: Partial<Record<ProfileId, string>> = {
  fat: '烹饪油脂',
  liquid: '液体',
  seasoning: '调味',
  spice: '香辛料',
  aromatic: '芳香配料',
}

/** 将任意分数取整并限制在游戏规定的 0-10 区间。 */
function clamp(value: number) {
  return Math.max(0, Math.min(10, Math.round(value)))
}

/** 把一个稀疏分数表按倍率累加到另一个分数表。 */
function addMap(target: ScoreMap, source: ScoreMap | undefined, multiplier = 1) {
  Object.entries(source ?? {}).forEach(([key, value]) => {
    if (value !== undefined) target[key] = (target[key] ?? 0) + value * multiplier
  })
}

/** 根据食材大类返回其在加工批次中的作用。 */
export function roleFor(profile: ProfileId) {
  return roleLabels[profile] ?? '主体食材'
}

/** 解析某项操作在指定食材大类和进度下的外观描述。 */
export function resolveDescription(operationId: string, profile: ProfileId, level: number | null) {
  const operation = operations[operationId]
  if (!operation) throw new Error(`未知操作：${operationId}`)
  if (operation.kind === 'instant') return operation.appearance

  const model = progressModels[operationId]
  if (!model) throw new Error(`操作缺少进度模型：${operationId}`)
  const safeLevel = Math.max(0, Math.min(4, level ?? 0))
  return (model.overrides?.[profile] ?? model.default)[safeLevel]
}

/** 取得已处理食材的首个主体大类，供后续兼容性判断使用。 */
export function itemPrimaryProfile(item: ProcessedItem) {
  return item.ingredients.find((ingredient) => roleFor(ingredient.profile) === '主体食材')?.profile
    ?? item.ingredients[0]?.profile
}

/** 判断指定操作是否允许投入某个食材大类。 */
export function isInputCompatible(operationId: string, profile: ProfileId) {
  return operations[operationId]?.profiles.includes(profile) || false
}

/** 将基础食材转换为尚未执行的批次投入。 */
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

/** 将已有产物及其历史转换为可继续加工的批次投入。 */
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

/** 合并食材大类感官值与具体食材覆盖值。 */
function ingredientScores(ingredient: Ingredient) {
  return { ...profileSensory[ingredient.profile], ...ingredientSensory[ingredient.name] }
}

/** 合并食材大类物理特征与具体食材覆盖值。 */
function ingredientFeatureScores(ingredient: Ingredient) {
  return { ...profileTraits[ingredient.profile], ...ingredientTraits[ingredient.name] }
}

/** 计算单个产物的最终感官值。 */
export function calculateSensory(item: Pick<ProcessedItem, 'ingredients' | 'history'>) {
  return calculateSensoryDetails(item).result
}

/** 计算单个产物，并保留每个基础值和加工反应的贡献明细。 */
export function calculateSensoryDetails(
  item: Pick<ProcessedItem, 'ingredients' | 'history'>,
): SensoryCalculation {
  const contributions: SensoryCalculation['contributions'] = []
  /** 过滤无效的零值，并把一个有来源说明的贡献加入计算轨迹。 */
  const addContribution = (source: string, contribution: ScoreMap<SenseId>, includeEmpty = false) => {
    const scores = Object.fromEntries(
      Object.entries(contribution).filter(([, value]) => value !== undefined && value !== 0),
    ) as ScoreMap<SenseId>
    if (includeEmpty || Object.keys(scores).length > 0) contributions.push({ source, scores })
  }

  item.ingredients.forEach((ingredient) => {
    addContribution(`${ingredient.name}基础（${profileLabels[ingredient.profile]}）`, ingredientScores(ingredient), true)
  })

  item.history.forEach((step, stepIndex) => {
    const active = item.ingredients.filter((ingredient) => step.activeNames.includes(ingredient.name))
    if (operations[step.operationId]?.kind !== 'progressive') return

    active.forEach((ingredient) => {
      const level = step.levelsByName[ingredient.name] ?? 0
      const traits = ingredientFeatureScores(ingredient)
      const adjustment: ScoreMap<SenseId> = {}

      if (['red_meat', 'poultry', 'fish', 'shellfish'].includes(ingredient.profile)) {
        adjustment.bloody = -[0, 1, 4, 5, 5][level]
      }
      if (wetHeat.has(step.operationId)) {
        adjustment.moist = (adjustment.moist ?? 0) + [0, 1, 2, 3, 3][level]
        if (level >= 3) adjustment.dry = (adjustment.dry ?? 0) + level - 3
      }
      if (dryHeat.has(step.operationId)) {
        adjustment.moist = (adjustment.moist ?? 0) - [0, 0, 1, 2, 3][level]
        adjustment.dry = (adjustment.dry ?? 0) + [0, 0, 0, 1, 3][level]
        adjustment.roasted = (adjustment.roasted ?? 0) + [0, 1, 2, 3, 4][level]
      }
      if (step.operationId === 'grilled') adjustment.smoky = (adjustment.smoky ?? 0) + [0, 1, 2, 3, 4][level]
      if (step.operationId === 'deep_fried') adjustment.crisp = (adjustment.crisp ?? 0) + [0, 1, 3, 4, 5][level]
      if (['baked', 'roasted', 'pan_fried', 'griddled'].includes(step.operationId) && level >= 2) {
        adjustment.crisp = (adjustment.crisp ?? 0) + level - 1
      }
      if ((traits.sugar ?? 0) > 0 && dryHeat.has(step.operationId) && level >= 2) {
        adjustment.sweet = (adjustment.sweet ?? 0) + 1
        adjustment.roasted = (adjustment.roasted ?? 0) + Math.min(2, level - 1)
      }
      if (['大蒜', '姜'].includes(ingredient.name) && level >= 1) {
        adjustment.pungent = (adjustment.pungent ?? 0) - Math.min(2, level)
        adjustment.aromatic = (adjustment.aromatic ?? 0) + Math.min(3, level)
      }
      addContribution(`第 ${stepIndex + 1} 步 ${stepTitle(step)} · ${ingredient.name} ${level}/4`, adjustment)
    })

    const hasFat = active.some((ingredient) => (ingredientFeatureScores(ingredient).fat ?? 0) > 0)
    const proteinHeat = Math.max(0, ...active
      .filter((ingredient) => (ingredientFeatureScores(ingredient).protein ?? 0) > 0)
      .map((ingredient) => step.levelsByName[ingredient.name] ?? 0))
    if (hasFat && dryHeat.has(step.operationId) && proteinHeat >= 2) {
      addContribution(
        `第 ${stepIndex + 1} 步 ${stepTitle(step)} · 油脂与蛋白质批次反应`,
        { roasted: Math.min(3, proteinHeat - 1) },
      )
    }
  })

  const totals: ScoreMap<SenseId> = {}
  contributions.forEach((contribution) => addMap(totals, contribution.scores))
  const beforeClamp = Object.fromEntries(
    senseIds.map((sense) => [sense, totals[sense] ?? 0]),
  ) as Record<SenseId, number>
  const result = Object.fromEntries(
    senseIds.map((sense) => [sense, clamp(beforeClamp[sense])]),
  ) as Record<SenseId, number>
  return { contributions, beforeClamp, result }
}

/** 执行一个批次，消费其输入并生成包含完整历史的新产物。 */
export function processBatch(inputs: BatchInput[], toolId: string, operationId: string, id: number) {
  if (inputs.length === 0) throw new Error('加工批次不能为空')
  const operation = operations[operationId]
  if (!operation) throw new Error(`未知操作：${operationId}`)

  const itemIngredients = uniqueIngredients(inputs.flatMap((input) => input.ingredients))
  const levelsByName: Record<string, number | null> = {}
  inputs.forEach((input) => input.ingredients.forEach((ingredient) => {
    levelsByName[ingredient.name] = operation.kind === 'progressive' ? input.level : null
  }))

  const appearancesByName = Object.fromEntries(itemIngredients.map((ingredient) => [
    ingredient.name,
    resolveDescription(operationId, ingredient.profile, levelsByName[ingredient.name]),
  ]))
  const step: CookingStep = {
    toolId,
    operationId,
    levelsByName,
    activeNames: itemIngredients.map((ingredient) => ingredient.name),
    appearancesByName,
  }
  const titleIngredients = itemIngredients.filter((ingredient) => roleFor(ingredient.profile) === '主体食材')
  const titleParts = (titleIngredients.length ? titleIngredients : itemIngredients).map((ingredient) => ingredient.name)
  const item: ProcessedItem = {
    id,
    title: `${titleParts.slice(0, 3).join('、')}${itemIngredients.length > 3 ? '等' : ''}`,
    ingredients: itemIngredients,
    history: [...inputs.flatMap((input) => input.history), step],
    sensory: {} as Record<SenseId, number>,
  }
  item.sensory = calculateSensory(item)
  return item
}

/** 汇总所有现存产物，并返回限制与血味遮盖的计算过程。 */
export function dishSensoryDetails(items: ProcessedItem[]): DishSensoryCalculation {
  const total: ScoreMap<SenseId> = {}
  items.forEach((item) => addMap(total, item.sensory))
  const summed = Object.fromEntries(senseIds.map((sense) => [sense, total[sense] ?? 0])) as Record<SenseId, number>
  const clamped = Object.fromEntries(senseIds.map((sense) => [sense, clamp(summed[sense])])) as Record<SenseId, number>
  const bloodyMask = Math.floor(clamped.pungent * 0.3 + clamped.spicy * 0.2 + clamped.sour * 0.4 + clamped.aromatic * 0.2)
  const result = { ...clamped, bloody: clamp(clamped.bloody - bloodyMask) }
  return {
    itemContributions: items.map((item) => ({ itemId: item.id, title: item.title, scores: item.sensory })),
    summed,
    clamped,
    bloodyMask,
    result,
  }
}

/** 返回整道料理应用所有汇总规则后的感官值。 */
export function dishSensory(items: ProcessedItem[]) {
  return dishSensoryDetails(items).result
}

/** 汇总每个食材和历史厨具对菜系倾向的贡献。 */
export function cuisineDetails(items: ProcessedItem[]): CuisineCalculation {
  const scores: ScoreMap = {}
  const itemCalculations = items.map((item) => {
    const contributions: CuisineCalculation['items'][number]['contributions'] = []
    item.ingredients.forEach((ingredient) => {
      const contribution = ingredientCuisine[ingredient.name] ?? {}
      contributions.push({ source: `食材：${ingredient.name}`, scores: contribution })
      addMap(scores, contribution)
    })
    item.history.forEach((step, index) => {
      const tool = tools.find((candidate) => candidate.id === step.toolId)
      if (tool) {
        contributions.push({ source: `第 ${index + 1} 步厨具：${tool.name}`, scores: tool.cuisine })
        addMap(scores, tool.cuisine)
      }
    })
    return { itemId: item.id, title: item.title, contributions }
  })
  const result: CuisineScore[] = Object.entries(scores)
    .map(([name, score]) => ({ name, score: score ?? 0 }))
    .sort((left, right) => right.score - left.score)
  return { items: itemCalculations, result }
}

/** 返回按分数降序排列的整菜菜系结果。 */
export function cuisineScores(items: ProcessedItem[]): CuisineScore[] {
  return cuisineDetails(items).result
}

/** 选取主要感官特征并附加湿润与干燥的净值描述。 */
export function sensorySummary(scores: Record<SenseId, number>) {
  const strong = Object.entries(scores)
    .filter(([, value]) => value >= 2)
    .sort((left, right) => right[1] - left[1])
    .slice(0, 7)
    .map(([key, value]) => `${senseLabels[key as SenseId]} ${value}`)
  const balance = scores.moist - scores.dry
  const moisture = balance > 1
    ? `整体偏湿润（净值 ${balance}）`
    : balance < -1
      ? `整体偏干燥（净值 ${-balance}）`
      : '湿润与干燥大致平衡'
  return `${strong.join('，') || '感官特征较轻'}；${moisture}`
}

/** 将加工事件转换为“厨具 → 操作”的标题。 */
export function stepTitle(step: CookingStep) {
  const tool = tools.find((candidate) => candidate.id === step.toolId)
  return `${tool?.name ?? step.toolId} → ${operations[step.operationId]?.label ?? step.operationId}`
}

/** 将加工事件中每种食材的进度和外观转换为展示文本。 */
export function stepResults(step: CookingStep) {
  return step.activeNames.map((name) => {
    const level = step.levelsByName[name]
    return `${name}${level === null ? '' : ` ${level}/4`}：${step.appearancesByName[name]}`
  })
}
