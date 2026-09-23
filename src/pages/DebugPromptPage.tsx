import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  createProcessedInput,
  createRawInput,
  cuisineScores,
  dishSensory,
  isInputCompatible,
  itemPrimaryProfile,
  resolveDescription,
  roleFor,
  sensorySummary,
  stepResults,
  stepTitle,
} from '../cooking/cooking'
import { ingredientGroups, operations, tools } from '../cooking/data/catalog'
import { progressModels } from '../cooking/data/progress'
import { senseLabels } from '../cooking/data/sensory'
import { buildImagePrompt } from '../cooking/prompt'
import { useCookingStore } from '../cooking/store'

const levels = [0, 1, 2, 3, 4]

export function DebugPromptPage() {
  const [toolId, setToolId] = useState(tools[0].id)
  const [operationId, setOperationId] = useState(tools[0].operationIds[0])
  const [ingredientValue, setIngredientValue] = useState('raw:牛肉')
  const [progress, setProgress] = useState(2)
  const [copyLabel, setCopyLabel] = useState('复制提示词')

  const items = useCookingStore((state) => state.items)
  const batchInputs = useCookingStore((state) => state.batchInputs)
  const addBatchInput = useCookingStore((state) => state.addBatchInput)
  const removeBatchInput = useCookingStore((state) => state.removeBatchInput)
  const setBatchInputProgress = useCookingStore((state) => state.setBatchInputProgress)
  const clearBatch = useCookingStore((state) => state.clearBatch)
  const processCurrentBatch = useCookingStore((state) => state.processCurrentBatch)
  const removeProcessedItem = useCookingStore((state) => state.removeProcessedItem)
  const reset = useCookingStore((state) => state.reset)

  const tool = tools.find((candidate) => candidate.id === toolId) ?? tools[0]
  const operation = operations[operationId]
  const progressive = operation.kind === 'progressive'
  const compatibleItems = items.filter((item) => {
    const profile = itemPrimaryProfile(item)
    return profile && isInputCompatible(toolId, operationId, profile)
  })
  const compatibleGroups = ingredientGroups.map((group) => ({
    ...group,
    names: isInputCompatible(toolId, operationId, group.profile) ? group.names : [],
  })).filter((group) => group.names.length > 0)
  const availableValues = [
    ...compatibleItems.map((item) => `item:${item.id}`),
    ...compatibleGroups.flatMap((group) => group.names.map((name) => `raw:${name}`)),
  ]

  useEffect(() => {
    if (!availableValues.includes(ingredientValue)) setIngredientValue(availableValues[0] ?? '')
  }, [availableValues, ingredientValue])

  const selectedItem = ingredientValue.startsWith('item:')
    ? items.find((item) => item.id === Number(ingredientValue.slice(5)))
    : undefined
  const selectedIngredient = ingredientValue.startsWith('raw:')
    ? ingredientGroups.flatMap((group) => group.names.map((name) => ({ name, profile: group.profile })))
      .find((ingredient) => ingredient.name === ingredientValue.slice(4))
    : undefined
  const selectedProfile = selectedItem ? itemPrimaryProfile(selectedItem) : selectedIngredient?.profile
  const sensory = dishSensory(items)
  const cuisines = cuisineScores(items)
  const prompt = buildImagePrompt(items)

  function changeTool(nextToolId: string) {
    const nextTool = tools.find((candidate) => candidate.id === nextToolId) ?? tools[0]
    setToolId(nextTool.id)
    setOperationId(nextTool.operationIds[0])
    clearBatch()
  }

  function changeOperation(nextOperationId: string) {
    setOperationId(nextOperationId)
    clearBatch()
  }

  function addInput() {
    if (!ingredientValue) return
    const level = progressive ? progress : null
    if (selectedItem) addBatchInput(createProcessedInput(selectedItem, level))
    else addBatchInput(createRawInput(ingredientValue.slice(4), level))
  }

  async function copyPrompt() {
    await navigator.clipboard.writeText(prompt)
    setCopyLabel('已复制')
    window.setTimeout(() => setCopyLabel('复制提示词'), 1000)
  }

  return (
    <main className="debug-page">
      <header className="page-header">
        <div>
          <Link to="/">← 返回首页</Link>
          <h1>料理提示词调试器</h1>
          <p>选择厨具与操作，再投入基础食材或已处理食材。</p>
        </div>
        <button className="secondary compact" type="button" onClick={reset}>重置全部</button>
      </header>

      <section>
        <h2>厨具处理</h2>
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
              {tool.operationIds.map((id) => <option key={id} value={id}>{operations[id].label}</option>)}
            </select>
          </label>

          {progressive && (
            <div className="progress-panel full-width">
              <label>
                默认加工进度
                <select value={progress} onChange={(event) => setProgress(Number(event.target.value))}>
                  {levels.map((level) => <option key={level} value={level}>{level} / 4</option>)}
                </select>
              </label>
              <div>
                <span className="badge">按每项食材解析</span>
                <span className="badge">{progressModels[operationId].axis}</span>
                {selectedProfile && <p>{resolveDescription(operationId, selectedProfile, progress)}</p>}
              </div>
            </div>
          )}

          <label>
            投入食材
            <select value={ingredientValue} onChange={(event) => setIngredientValue(event.target.value)}>
              {compatibleItems.length > 0 && (
                <optgroup label="已处理食材">
                  {compatibleItems.map((item) => <option key={item.id} value={`item:${item.id}`}>♻ {item.title}</option>)}
                </optgroup>
              )}
              {compatibleGroups.map((group) => (
                <optgroup key={group.label} label={group.label}>
                  {group.names.map((name) => <option key={name} value={`raw:${name}`}>{name}</option>)}
                </optgroup>
              ))}
            </select>
          </label>
          <label>
            食材作用
            <input disabled value={selectedProfile ? roleFor(selectedProfile) : ''} readOnly />
          </label>
        </div>

        <button className="secondary" type="button" onClick={addInput} disabled={!ingredientValue}>加入本次处理</button>
        <div className="item-list batch-list">
          {batchInputs.length === 0 && <p className="empty">请加入本次处理所需的食材、油脂与调味。</p>}
          {batchInputs.map((input) => (
            <article className="list-item" key={input.key}>
              <div>
                <strong>{input.label}</strong>
                <small>{roleFor(input.profile)} · {resolveDescription(operationId, input.profile, input.level)}</small>
                {progressive && (
                  <label className="inline-field">
                    加工进度
                    <select value={input.level ?? 0} onChange={(event) => setBatchInputProgress(input.key, Number(event.target.value))}>
                      {levels.map((level) => <option key={level} value={level}>{level} / 4</option>)}
                    </select>
                  </label>
                )}
              </div>
              <button className="secondary compact" type="button" onClick={() => removeBatchInput(input.key)}>移除</button>
            </article>
          ))}
        </div>
        <button type="button" disabled={batchInputs.length === 0} onClick={() => processCurrentBatch(toolId, operationId)}>执行处理</button>
      </section>

      <section>
        <h2>已处理食材</h2>
        <div className="item-list">
          {items.length === 0 && <p className="empty">尚未产生已处理食材。</p>}
          {items.map((item) => (
            <article className="list-item" key={item.id}>
              <div>
                <strong>{item.title}</strong>
                <small>组成：{item.ingredients.map((ingredient) => `${ingredient.name}（${roleFor(ingredient.profile)}）`).join('、')}</small>
                <ol className="history">
                  {item.history.map((step, index) => (
                    <li key={`${item.id}-${index}`}>
                      {stepTitle(step)}
                      {stepResults(step).map((result) => <small key={result}>{result}</small>)}
                    </li>
                  ))}
                </ol>
              </div>
              <button className="secondary compact" type="button" onClick={() => removeProcessedItem(item.id)}>移除</button>
            </article>
          ))}
        </div>
        <p className="summary">菜系倾向：{cuisines.length ? cuisines.map(({ name, score }) => `${name} ${score}`).join(' · ') : '自由融合'}</p>
      </section>

      <section>
        <h2>感官画像</h2>
        <div className="sensory-grid">
          {Object.entries(senseLabels).map(([key, label]) => {
            const score = sensory[key as keyof typeof sensory]
            return (
              <div className="sense" key={key}>
                <span>{label}</span>
                <span className="sense-bar"><i style={{ width: `${score * 10}%` }} /></span>
                <b>{score}</b>
              </div>
            )
          })}
        </div>
        <p className="summary">{sensorySummary(sensory)}</p>
      </section>

      <section>
        <h2>最终提示词</h2>
        <textarea value={prompt} readOnly />
        <button className="compact" type="button" onClick={copyPrompt}>{copyLabel}</button>
      </section>
    </main>
  )
}
