import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { processBatch } from './cooking'
import type { BatchInput, ProcessedItem } from './types'

interface CookingState {
  items: ProcessedItem[]
  batchInputs: BatchInput[]
  nextItemId: number
  addBatchInput: (input: BatchInput) => void
  removeBatchInput: (key: string) => void
  setBatchInputProgress: (key: string, level: number) => void
  clearBatch: () => void
  processCurrentBatch: (toolId: string, operationId: string) => void
  removeProcessedItem: (id: number) => void
  reset: () => void
}

const initialState = {
  items: [] as ProcessedItem[],
  batchInputs: [] as BatchInput[],
  nextItemId: 1,
}

export const useCookingStore = create<CookingState>()(devtools((set) => ({
  ...initialState,
  addBatchInput: (input) => set((state) => {
    if (state.batchInputs.some((candidate) => candidate.key === input.key)) return state
    return { batchInputs: [...state.batchInputs, input] }
  }, undefined, 'cooking/addBatchInput'),
  removeBatchInput: (key) => set((state) => ({
    batchInputs: state.batchInputs.filter((input) => input.key !== key),
  }), undefined, 'cooking/removeBatchInput'),
  setBatchInputProgress: (key, level) => set((state) => ({
    batchInputs: state.batchInputs.map((input) => input.key === key ? { ...input, level } : input),
  }), undefined, 'cooking/setBatchInputProgress'),
  clearBatch: () => set({ batchInputs: [] }, undefined, 'cooking/clearBatch'),
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
  removeProcessedItem: (id) => set((state) => ({
    items: state.items.filter((item) => item.id !== id),
    batchInputs: state.batchInputs.filter((input) => input.itemId !== id),
  }), undefined, 'cooking/removeProcessedItem'),
  reset: () => set(initialState, undefined, 'cooking/reset'),
}), { name: 'Chef’s Delight cooking' }))
