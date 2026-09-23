/** 烹饪调试页面：编辑加工批次并实时检查计算明细与最终提示词。 */
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  calculateSensoryDetails,
  createProcessedInput,
  createRawInput,
  cuisineDetails,
  dishSensoryDetails,
  isOperationAvailable,
  isOperationTargetInput,
  itemPrimaryProfile,
  resolveDescription,
  roleFor,
  stepResults,
  stepTitle,
} from '../cooking/cooking'
import { ingredientGroups, ingredients, profileLabels, tools } from '../cooking/data/catalog'
import { operations } from '../cooking/data/operations'
import { senseLabels } from '../cooking/data/sensory'
import { buildImagePrompt } from '../cooking/prompt'
import { useCookingStore } from '../cooking/store'
import type { ScoreMap, SenseId } from '../cooking/types'
import '../styles/debug-prompt.css'

const levels = [0, 1, 2, 3, 4]

/** 将非零感官分数转换为适合调试面板阅读的文本。 */
function formatSensory(scores: ScoreMap<SenseId>, signed = false) {
  const values = Object.entries(scores)
    .filter(([, value]) => value !== undefined && value !== 0)
    .map(([key, value]) => `${senseLabels[key as SenseId]} ${signed && value! > 0 ? '+' : ''}${value}`)
  return values.join('，') || '无感官数值'
}

/** 将非零菜系贡献转换为“菜系 +分数”的文本。 */
function formatCuisine(scores: ScoreMap) {
  const values = Object.entries(scores)
    .filter(([, value]) => value !== undefined && value !== 0)
    .map(([name, value]) => `${name} +${value}`)
  return values.join('，') || '无菜系加分'
}

/** 组合左侧加工操作与右侧实时输出、计算追踪。 */
export function DebugPromptPage() {
  const [toolId, setToolId] = useState(tools[0].id)
  const [operationId, setOperationId] = useState(tools[0].operationIds[0])
  const [ingredientValue, setIngredientValue] = useState('raw:牛肉')
  const [copyLabel, setCopyLabel] = useState('复制')

  const items = useCookingStore((state) => state.items)
  const batchInputs = useCookingStore((state) => state.batchInputs)
  const addBatchInput = useCookingStore((state) => state.addBatchInput)
  const removeBatchInput = useCookingStore((state) => state.removeBatchInput)
  const setBatchInputProgress = useCookingStore((state) => state.setBatchInputProgress)
  const processCurrentBatch = useCookingStore((state) => state.processCurrentBatch)
  const removeProcessedItem = useCookingStore((state) => state.removeProcessedItem)
  const reset = useCookingStore((state) => state.reset)

  const tool = tools.find((candidate) => candidate.id === toolId) ?? tools[0]
  const availableOperationIds = tool.operationIds.filter((id) => isOperationAvailable(id, batchInputs))
  const operation = availableOperationIds.includes(operationId) ? operations[operationId] : undefined
  const progressive = operation?.kind === 'progressive'
  const selectedKeys = new Set(batchInputs.map((input) => input.key))
  const availableItems = items.filter((item) => !selectedKeys.has(`item:${item.id}`))
  const availableValues = [
    ...availableItems.map((item) => `item:${item.id}`),
    ...ingredientGroups.flatMap((group) => group.names
      .map((name) => `raw:${name}`)
      .filter((value) => !selectedKeys.has(value))),
  ]

  useEffect(() => {
    if (!availableOperationIds.includes(operationId)) setOperationId(availableOperationIds[0] ?? '')
  }, [availableOperationIds, operationId])

  useEffect(() => {
    if (!availableValues.includes(ingredientValue)) setIngredientValue(availableValues[0] ?? '')
  }, [availableValues, ingredientValue])

  const selectedItem = ingredientValue.startsWith('item:')
    ? items.find((item) => item.id === Number(ingredientValue.slice(5)))
    : undefined
  const selectedIngredient = ingredientValue.startsWith('raw:')
    ? ingredients.find((ingredient) => ingredient.name === ingredientValue.slice(4))
    : undefined
  const selectedProfile = selectedItem ? itemPrimaryProfile(selectedItem) : selectedIngredient?.profile
  const sensoryCalculation = dishSensoryDetails(items)
  const cuisineCalculation = cuisineDetails(items)
  const prompt = buildImagePrompt(items)

  /** 切换厨具时保留批次，并选择该厨具下首个满足当前批次的操作。 */
  function changeTool(nextToolId: string) {
    const nextTool = tools.find((candidate) => candidate.id === nextToolId) ?? tools[0]
    setToolId(nextTool.id)
    setOperationId(nextTool.operationIds.find((id) => isOperationAvailable(id, batchInputs)) ?? '')
  }

  /** 切换 operation 时保留当前批次及其加工进度。 */
  function changeOperation(nextOperationId: string) {
    setOperationId(nextOperationId)
  }

  /** 将当前选择加入批次；若之后选择渐进 operation，则从 0/4 开始。 */
  function addInput() {
    if (!ingredientValue) return
    const level = 0
    if (selectedItem) addBatchInput(createProcessedInput(selectedItem, level))
    else addBatchInput(createRawInput(ingredientValue.slice(4), level))
  }

  /** 将实时生成的图片提示词写入系统剪贴板。 */
  async function copyPrompt() {
    await navigator.clipboard.writeText(prompt)
    setCopyLabel('已复制')
    window.setTimeout(() => setCopyLabel('复制'), 1000)
  }

  return (
    <main className="debug-page">
      <header className="page-header">
        <div>
          <Link to="/">返回首页</Link>
          <h1>料理提示词调试器</h1>
        </div>
        <button className="plain-button" type="button" onClick={reset}>重置</button>
      </header>

      <div className="debug-layout">
        <div className="debug-left">
          <section className="debug-panel">
            <h2>加工</h2>
            <div className="form-grid">
              <label>
                厨具
                <select value={toolId} onChange={(event) => changeTool(event.target.value)}>
                  {tools.map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.name}</option>)}
                </select>
              </label>
              <label>
                操作
                <select value={operationId} onChange={(event) => changeOperation(event.target.value)}>
                  {availableOperationIds.length === 0 && <option value="">当前批次没有可用操作</option>}
                  {availableOperationIds.map((id) => <option key={id} value={id}>{operations[id].label}</option>)}
                </select>
              </label>
              <label>
                投入食材
                <select value={ingredientValue} onChange={(event) => setIngredientValue(event.target.value)}>
                  {availableItems.length > 0 && (
                    <optgroup label="已处理食材">
                      {availableItems.map((item) => <option key={item.id} value={`item:${item.id}`}>{item.title}</option>)}
                    </optgroup>
                  )}
                  {ingredientGroups.map((group) => (
                    <optgroup key={group.profile} label={profileLabels[group.profile]}>
                      {group.names
                        .filter((name) => !selectedKeys.has(`raw:${name}`))
                        .map((name) => <option key={name} value={`raw:${name}`}>{name}</option>)}
                    </optgroup>
                  ))}
                </select>
              </label>
              <label>
                食材作用
                <input disabled value={selectedProfile ? roleFor(selectedProfile) : ''} readOnly />
              </label>
            </div>
            <button className="plain-button" type="button" onClick={addInput} disabled={!ingredientValue}>加入批次</button>

            <div className="simple-list batch-list">
              {batchInputs.length === 0 && <p className="empty">当前批次为空</p>}
              {batchInputs.map((input) => (
                <div className="simple-item" key={input.key}>
                  <div>
                    <strong>{input.label}</strong>
                    <small>
                      {roleFor(input.profile)}
                      {operation && ` · ${isOperationTargetInput(operationId, input)
                        ? resolveDescription(operationId, input.profile, input.level)
                        : `作为${roleFor(input.profile)}参与处理`}`}
                    </small>
                    {progressive && isOperationTargetInput(operationId, input) && (
                      <label className="inline-field">
                        进度
                        <select value={input.level ?? 0} onChange={(event) => setBatchInputProgress(input.key, Number(event.target.value))}>
                          {levels.map((level) => <option key={level} value={level}>{level} / 4</option>)}
                        </select>
                      </label>
                    )}
                  </div>
                  <button className="text-button" type="button" onClick={() => removeBatchInput(input.key)}>移除</button>
                </div>
              ))}
            </div>
            <button type="button" disabled={batchInputs.length === 0 || !operationId} onClick={() => processCurrentBatch(toolId, operationId)}>执行处理</button>
          </section>

          <section className="debug-panel">
            <h2>已处理食材</h2>
            <div className="simple-list">
              {items.length === 0 && <p className="empty">尚无已处理食材</p>}
              {items.map((item) => (
                <div className="simple-item" key={item.id}>
                  <div>
                    <strong>{item.title}</strong>
                    <small>组成：{item.ingredients.map((ingredient) => ingredient.name).join('、')}</small>
                    <ol className="history">
                      {item.history.map((step, index) => (
                        <li key={`${item.id}-${index}`}>
                          {stepTitle(step)}
                          {stepResults(step).map((result) => <small key={result}>{result}</small>)}
                        </li>
                      ))}
                    </ol>
                  </div>
                  <button className="text-button" type="button" onClick={() => removeProcessedItem(item.id)}>移除</button>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="debug-right">
          <section className="debug-panel prompt-panel">
            <div className="panel-heading">
              <h2>实时提示词</h2>
              <button className="text-button" type="button" onClick={copyPrompt}>{copyLabel}</button>
            </div>
            <textarea value={prompt} readOnly />
          </section>

          <section className="debug-panel calculation-panel">
            <h2>感官计算</h2>
            {items.length === 0 && <p className="empty">执行加工后显示计算过程</p>}
            {items.map((item) => {
              const calculation = calculateSensoryDetails(item)
              return (
                <details key={item.id} open>
                  <summary>{item.title}</summary>
                  <ul className="calculation-list">
                    {calculation.contributions.map((contribution, index) => (
                      <li key={`${contribution.source}-${index}`}>
                        <span>{contribution.source}</span>
                        <code>{formatSensory(contribution.scores, true)}</code>
                      </li>
                    ))}
                  </ul>
                  <p><strong>限制前：</strong>{formatSensory(calculation.beforeClamp)}</p>
                  <p><strong>当前值：</strong>{formatSensory(calculation.result)}</p>
                </details>
              )
            })}

            {items.length > 0 && (
              <div className="overall-calculation">
                <h3>整菜汇总</h3>
                <ul className="calculation-list">
                  {sensoryCalculation.itemContributions.map((item) => (
                    <li key={item.itemId}><span>{item.title}</span><code>{formatSensory(item.scores)}</code></li>
                  ))}
                </ul>
                <p><strong>累加：</strong>{formatSensory(sensoryCalculation.summed)}</p>
                <p><strong>限制到 0-10：</strong>{formatSensory(sensoryCalculation.clamped)}</p>
                {sensoryCalculation.maskAdjustments.map((adjustment) => (
                  <p key={adjustment.target}>
                    <strong>{senseLabels[adjustment.target]}遮盖：</strong>
                    floor({Object.entries(adjustment.weights)
                      .map(([sense, weight]) => `${senseLabels[sense as SenseId]} × ${weight}`)
                      .join(' + ')}) = {adjustment.amount}
                  </p>
                ))}
                <p><strong>最终：</strong>{formatSensory(sensoryCalculation.result)}</p>
              </div>
            )}

            <h2 className="subheading">菜系计算</h2>
            {items.length === 0 && <p className="empty">尚无菜系贡献</p>}
            {cuisineCalculation.items.map((item) => (
              <details key={item.itemId} open>
                <summary>{item.title}</summary>
                <ul className="calculation-list">
                  {item.contributions.map((contribution, index) => (
                    <li key={`${contribution.source}-${index}`}>
                      <span>{contribution.source}</span>
                      <code>{formatCuisine(contribution.scores)}</code>
                    </li>
                  ))}
                </ul>
              </details>
            ))}
            {items.length > 0 && (
              <p>
                <strong>总计：</strong>
                {cuisineCalculation.result.length
                  ? cuisineCalculation.result.map(({ name, score }) => `${name} ${score}`).join('，')
                  : '自由融合'}
              </p>
            )}
          </section>
        </div>
      </div>
    </main>
  )
}
