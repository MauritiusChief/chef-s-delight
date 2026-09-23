/** Zustand 状态层：管理当前批次和已处理食材，不承载计算规则。 */
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { processBatch } from './cooking'
import type { BatchInput, PlatingRoleId, ProcessedItem } from './types'

/** 调试器可变状态以及页面能够触发的状态操作。 */
interface CookingState {
  items: ProcessedItem[]
  batchInputs: BatchInput[]
  nextItemId: number
  addBatchInput: (input: BatchInput) => void
  removeBatchInput: (key: string) => void
  setBatchInputProgress: (key: string, level: number) => void
  processCurrentBatch: (toolId: string, operationId: string) => void
  setProcessedItemPlatingRole: (id: number, role: PlatingRoleId | null) => void
  removeProcessedItem: (id: number) => void
  reset: () => void
}

/** 每次重置或首次创建 store 时使用的空料理状态。 */
const initialState = {
  items: [] as ProcessedItem[],
  batchInputs: [] as BatchInput[],
  nextItemId: 1,
}

/** 全局烹饪 store；devtools action 名用于检查每次加工造成的变化。 */
export const useCookingStore = create<CookingState>()(devtools((set) => ({
  ...initialState,
  // 忽略同一批次中的重复投入。
  addBatchInput: (input) => set((state) => {
    if (state.batchInputs.some((candidate) => candidate.key === input.key)) return state
    return { batchInputs: [...state.batchInputs, input] }
  }, undefined, 'cooking/addBatchInput'),
  // 从尚未执行的批次中移除指定投入。
  removeBatchInput: (key) => set((state) => ({
    batchInputs: state.batchInputs.filter((input) => input.key !== key),
  }), undefined, 'cooking/removeBatchInput'),
  // 单独修改一个批次投入的加工进度。
  setBatchInputProgress: (key, level) => set((state) => ({
    batchInputs: state.batchInputs.map((input) => input.key === key ? { ...input, level } : input),
  }), undefined, 'cooking/setBatchInputProgress'),
  // 执行当前批次，并用新产物替换被消费的旧产物。
  processCurrentBatch: (toolId, operationId) => set((state) => {
    if (state.batchInputs.length === 0) return state
    const item = processBatch(state.batchInputs, toolId, operationId, state.nextItemId)
    const consumedIds = new Set(state.batchInputs.flatMap((input) => input.itemId ?? []))
    return {
      items: [...state.items.filter((existing) => !consumedIds.has(existing.id)), item],
      batchInputs: [],
      nextItemId: state.nextItemId + 1,
    }
  }, undefined, 'cooking/processCurrentBatch'),
  // 设置产物在最终成品中的结构与摆盘功能。
  setProcessedItemPlatingRole: (id, role) => set((state) => ({
    items: state.items.map((item) => item.id === id ? { ...item, platingRole: role } : item),
  }), undefined, 'cooking/setProcessedItemPlatingRole'),
  // 删除产物，同时清除仍然引用它的批次投入。
  removeProcessedItem: (id) => set((state) => ({
    items: state.items.filter((item) => item.id !== id),
    batchInputs: state.batchInputs.filter((input) => input.itemId !== id),
  }), undefined, 'cooking/removeProcessedItem'),
  // 恢复空的调试状态和 ID 计数器。
  reset: () => set(initialState, undefined, 'cooking/reset'),
}), { name: 'Chef’s Delight cooking' }))
