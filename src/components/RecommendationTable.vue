<script setup lang="ts">
import { ref, watch } from 'vue'
import type { HistoryRecord } from '@/types'
import { formatDate } from '@/utils/date'
import { getStockLinkUrl, recordKey, formatProbability } from '@/utils/stock'

const props = withDefaults(defineProps<{
  records: HistoryRecord[]
  loading: boolean
  emptyText?: string
  currentPrices: Record<string, number>
  isLoadingPrices: boolean
}>(), {
  emptyText: '目前沒有紀錄'
})

const expandedKeys = ref<Set<string>>(new Set())

const toggleExpand = (key: string) => {
  const newSet = new Set(expandedKeys.value)
  if (newSet.has(key)) {
    newSet.delete(key)
  } else {
    newSet.add(key)
  }
  expandedKeys.value = newSet
}

watch(() => props.records, () => {
  expandedKeys.value = new Set()
})
</script>

<template>
  <div class="overflow-x-auto">
    <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
      <thead class="bg-stone-50 dark:bg-gray-700/50">
        <tr>
          <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">日期</th>
          <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">股票代號</th>
          <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">選股策略</th>
          <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">即時價</th>
          <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">推薦價</th>
          <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">目標價</th>
          <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">停損價</th>
          <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">模型勝率</th>
          <th scope="col" class="px-6 py-3 relative"><span class="sr-only">詳細</span></th>
        </tr>
      </thead>
      <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
        <tr v-if="loading">
          <td colspan="9" class="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
            <div class="flex justify-center items-center space-x-2">
              <div class="w-4 h-4 bg-blue-600 rounded-full animate-bounce" style="animation-delay: -0.3s"></div>
              <div class="w-4 h-4 bg-blue-600 rounded-full animate-bounce" style="animation-delay: -0.15s"></div>
              <div class="w-4 h-4 bg-blue-600 rounded-full animate-bounce"></div>
            </div>
            <span class="mt-2 block text-sm">載入中...</span>
          </td>
        </tr>
        <tr v-else-if="records.length === 0">
          <td colspan="9" class="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
            {{ emptyText }}
          </td>
        </tr>
        <template v-else v-for="record in records" :key="recordKey(record)">
          <tr @click="toggleExpand(recordKey(record))" class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer group">
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
              {{ formatDate(record.RecommendationDate) }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <a
                :href="getStockLinkUrl(record.StockCode)"
                target="_blank"
                rel="noopener noreferrer"
                @click.stop
                class="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
              >{{ record.StockCode }}</a>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <span class="text-sm text-gray-900 dark:text-gray-200">{{ record.StrategyType }}</span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 font-medium">
              <span v-if="isLoadingPrices && !currentPrices[record.StockCode]">
                <div class="h-4 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              </span>
              <span v-else>
                ${{ currentPrices[record.StockCode]?.toFixed(2) || '-' }}
              </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-orange-500 dark:text-orange-400 font-semibold">
              ${{ record.BuyPoint }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-green-600 dark:text-green-400 font-semibold">
              ${{ record.SellPoint }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-red-500 dark:text-red-400">
              ${{ record.SuggestedExitPoint }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-purple-600 dark:text-purple-400 font-semibold">
              {{ formatProbability(record.ModelProbability) }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium" title="點擊展開 AI 分析">
              <div class="flex items-center justify-end text-gray-400 group-hover:text-blue-500 transition-colors">
                <span v-if="record.AiComment" class="mr-2 text-xs font-semibold bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300 px-2 py-0.5 rounded-full">AI 分析</span>
                <span aria-hidden="true">
                  <svg :class="{'rotate-180': expandedKeys.has(recordKey(record))}" class="h-5 w-5 transform transition-transform duration-200" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
                  </svg>
                </span>
              </div>
            </td>
          </tr>
          <!-- Expanded Row for AI Comment -->
          <tr v-if="expandedKeys.has(recordKey(record))" class="bg-indigo-50/30 dark:bg-indigo-900/10 border-b-2 border-indigo-100 dark:border-indigo-900/30">
            <td colspan="9" class="px-6 py-4">
              <div class="flex items-start">
                <div class="flex-shrink-0 mr-3 mt-0.5">
                  <svg class="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                </div>
                <div>
                  <h4 class="text-sm font-semibold text-indigo-900 dark:text-indigo-300 mb-1">AI 深度分析</h4>
                  <p class="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line leading-relaxed">
                    {{ record.AiComment || '目前無 AI 分析資料' }}
                  </p>
                </div>
              </div>
            </td>
          </tr>
        </template>
      </tbody>
    </table>
  </div>
</template>
