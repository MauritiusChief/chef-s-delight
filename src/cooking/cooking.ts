/** 烹饪领域规则：处理兼容性、加工事件、感官、菜系和调试明细。 */
import { ingredients, profileLabels, tools } from './data/catalog'
import { operations } from './data/operations'
import {
  batchReactions,
  dishMaskRules,
  ingredientReactions,
  profileReactions,
  traitReactions,
} from './data/reactions'
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
  Operation,
  ProcessedItem,
  ProfileId,
  ScoreMap,
  SensoryCalculation,
  SensoryEffectCurves,
  SenseId,
} from './types'

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

/** 读取某组五档效果曲线在当前加工进度下的感官变化。 */
function effectsAtLevel(effects: SensoryEffectCurves, level: number): ScoreMap<SenseId> {
  return Object.fromEntries(
    Object.entries(effects).map(([sense, values]) => [sense, values?.[level] ?? 0]),
  ) as ScoreMap<SenseId>
}

/** 根据食材大类返回其在加工批次中的作用。 */
export function roleFor(profile: ProfileId) {
  return roleLabels[profile] ?? '主体食材'
}

/** 解析某项操作在指定食材大类和进度下的外观描述。 */
export function resolveDescription(operationId: string, profile: ProfileId, level: number | null) {
  const operation = operations[operationId]
  if (!operation) throw new Error(`未知操作：${operationId}`)
  if (operation.kind === 'instant') return operation.description

  const safeLevel = Math.max(0, Math.min(4, level ?? 0))
  return (operation.description.byProfile?.[profile] ?? operation.description.levels)[safeLevel]
}

/** 取得已处理食材的首个主体大类，供后续兼容性判断使用。 */
export function itemPrimaryProfile(item: ProcessedItem) {
  return item.ingredients.find((ingredient) => roleFor(ingredient.profile) === '主体食材')?.profile
    ?? item.ingredients[0]?.profile
}

/** 判断基础食材是否是 operation 实际加工的主体。 */
function isIngredientTarget(operation: Operation, ingredient: Ingredient) {
  return operation.profiles.includes(ingredient.profile)
    || operation.targetTraits?.some((trait) => (ingredientFeatureScores(ingredient)[trait] ?? 0) > 0)
    || false
}

/** 判断一个批次投入是否包含 operation 实际加工的主体。 */
function isInputTarget(operation: Operation, input: BatchInput) {
  return operation.profiles.includes(input.profile)
    || input.ingredients.some((ingredient) => isIngredientTarget(operation, ingredient))
}

/** 判断批次投入是否会被指定 operation 作为主体加工。 */
export function isOperationTargetInput(operationId: string, input: BatchInput) {
  const operation = operations[operationId]
  return operation ? isInputTarget(operation, input) : false
}

/** 判断一个批次投入能否作为主体或辅助成分进入 operation。 */
function isInputCompatible(operation: Operation, input: BatchInput) {
  return isInputTarget(operation, input) || operation.supportProfiles?.includes(input.profile) || false
}

/** 返回 operation 对当前批次的首个不满足原因；空批次暂不参与过滤。 */
export function operationUnavailableReason(operationId: string, inputs: BatchInput[]) {
  const operation = operations[operationId]
  if (!operation) return '未知操作'
  if (inputs.length === 0) return null

  const incompatible = inputs.find((input) => !isInputCompatible(operation, input))
  if (incompatible) return `不接受${incompatible.label}`
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

/** 判断当前批次是否可以执行指定 operation。 */
export function isOperationAvailable(operationId: string, inputs: BatchInput[]) {
  return operationUnavailableReason(operationId, inputs) === null
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
    const operation = operations[step.operationId]
    if (operation?.kind !== 'progressive') return

    const targets = active.filter((ingredient) => isIngredientTarget(operation, ingredient))
    targets.forEach((ingredient) => {
      const level = step.levelsByName[ingredient.name] ?? 0
      const traits = ingredientFeatureScores(ingredient)
      const source = `第 ${stepIndex + 1} 步 ${stepTitle(step)} · ${ingredient.name} ${level}/4`

      operation.effects
        .filter((effect) => effect.profiles.includes(ingredient.profile))
        .forEach((effect) => {
          addContribution(`${source} · ${effect.label}`, effectsAtLevel(effect.effects, level))
        })

      profileReactions
        .filter((reaction) => reaction.profiles.includes(ingredient.profile))
        .forEach((reaction) => {
          addContribution(`${source} · ${reaction.label}`, effectsAtLevel(reaction.effects, level))
        })

      ingredientReactions
        .filter((reaction) => reaction.ingredients.includes(ingredient.name))
        .forEach((reaction) => {
          addContribution(`${source} · ${reaction.label}`, effectsAtLevel(reaction.effects, level))
        })

      traitReactions
        .filter((reaction) => reaction.operationIds.includes(step.operationId) && (traits[reaction.trait] ?? 0) > 0)
        .forEach((reaction) => {
          addContribution(`${source} · ${reaction.label}`, effectsAtLevel(reaction.effects, level))
        })
    })

    batchReactions
      .filter((reaction) => reaction.operationIds.includes(step.operationId))
      .forEach((reaction) => {
        const hasRequiredTraits = reaction.requiredTraits.every((trait) =>
          active.some((ingredient) => (ingredientFeatureScores(ingredient)[trait] ?? 0) > 0),
        )
        const reactionLevel = Math.max(0, ...active
          .filter((ingredient) => (ingredientFeatureScores(ingredient)[reaction.levelTrait] ?? 0) > 0)
          .map((ingredient) => step.levelsByName[ingredient.name] ?? 0))

        if (hasRequiredTraits && reactionLevel >= reaction.minimumLevel) {
          addContribution(
            `第 ${stepIndex + 1} 步 ${stepTitle(step)} · ${reaction.label}`,
            { [reaction.sense]: Math.min(reaction.maximumBonus, reactionLevel - reaction.levelOffset) },
          )
        }
      })
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

  const appearancesByName = Object.fromEntries(itemIngredients.map((ingredient) => [
    ingredient.name,
    isIngredientTarget(operation, ingredient)
      ? resolveDescription(operationId, ingredient.profile, levelsByName[ingredient.name])
      : `作为${roleFor(ingredient.profile)}参与处理`,
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
  const result = { ...clamped }
  const maskAdjustments = dishMaskRules.map((rule) => {
    const amount = Math.floor(Object.entries(rule.weights).reduce(
      (totalMask, [sense, weight]) => totalMask + clamped[sense as SenseId] * (weight ?? 0),
      0,
    ))
    result[rule.target] = clamp(result[rule.target] - amount)
    return { target: rule.target, amount, weights: rule.weights }
  })
  return {
    itemContributions: items.map((item) => ({ itemId: item.id, title: item.title, scores: item.sensory })),
    summed,
    clamped,
    maskAdjustments,
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
