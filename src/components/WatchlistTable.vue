<script setup lang="ts">
import { ref } from 'vue'
import type { StockAnalysis } from '@/types'
import ConfidenceBadge from './ConfidenceBadge.vue'

defineProps<{
  stocks: StockAnalysis[]
  loading?: boolean
}>()

const expandedRows = ref<Set<string>>(new Set())

function toggleRow(symbol: string) {
  if (expandedRows.value.has(symbol)) {
    expandedRows.value.delete(symbol)
  } else {
    expandedRows.value.add(symbol)
  }
}

function formatPrice(price: number): string {
  return price.toFixed(1)
}

function getPriceChangeClass(current: number, target: number): string {
  const change = ((target - current) / current) * 100
  if (change > 0) return 'text-green-600'
  if (change < 0) return 'text-red-600'
  return 'text-gray-600'
}
</script>

<template>
  <div class="overflow-x-auto">
    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center items-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <span class="ml-3 text-gray-600">載入中...</span>
    </div>

    <!-- Empty State -->
    <div v-else-if="stocks.length === 0" class="text-center py-12 text-gray-500">
      目前沒有觀察名單
    </div>

    <!-- Table -->
    <table v-else class="min-w-full divide-y divide-gray-200">
      <thead class="bg-gray-50">
        <tr>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            股票代號
          </th>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            收盤價
          </th>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            建議買入
          </th>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            建議賣出
          </th>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            止損價
          </th>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            信心指數
          </th>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            短評
          </th>
        </tr>
      </thead>
      <tbody class="bg-white divide-y divide-gray-200">
        <template v-for="stock in stocks" :key="stock.symbol">
          <!-- Main Row -->
          <tr
            class="hover:bg-gray-50 cursor-pointer transition-colors"
            @click="toggleRow(stock.symbol)"
          >
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="flex items-center">
                <span class="mr-2 text-gray-400">
                  {{ expandedRows.has(stock.symbol) ? '▼' : '▶' }}
                </span>
                <a
                  :href="stock.yahooUrl"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-blue-600 hover:text-blue-800 font-medium"
                  @click.stop
                >
                  {{ stock.symbol }}
                </a>
              </div>
              <div class="text-xs text-gray-500 mt-1 ml-6">{{ stock.category }}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap font-medium">
              {{ formatPrice(stock.closePrice) }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <span :class="getPriceChangeClass(stock.closePrice, stock.suggestedBuyPrice)">
                {{ formatPrice(stock.suggestedBuyPrice) }}
              </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <span class="text-green-600 font-medium">
                {{ formatPrice(stock.suggestedSellPrice) }}
              </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <span class="text-red-600">
                {{ formatPrice(stock.stopLossPrice) }}
              </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <ConfidenceBadge :confidence="stock.confidenceIndex" />
            </td>
            <td class="px-6 py-4 max-w-xs truncate text-sm text-gray-600">
              {{ stock.comment }}
            </td>
          </tr>

          <!-- Expanded Detail Row -->
          <tr v-if="expandedRows.has(stock.symbol)" class="bg-blue-50">
            <td colspan="7" class="px-6 py-4">
              <div class="space-y-4">
                <h4 class="font-semibold text-gray-900">技術分析詳情</h4>
                
                <div v-if="stock.detailedAnalysis" class="grid gap-4 md:grid-cols-3">
                  <!-- Entry Logic -->
                  <div class="bg-white p-4 rounded-lg shadow-sm">
                    <h5 class="font-medium text-blue-600 mb-2">進場邏輯</h5>
                    <p class="text-sm text-gray-700">{{ stock.detailedAnalysis.entryLogic }}</p>
                  </div>

                  <!-- Target Reason -->
                  <div class="bg-white p-4 rounded-lg shadow-sm">
                    <h5 class="font-medium text-green-600 mb-2">目標設定</h5>
                    <p class="text-sm text-gray-700">{{ stock.detailedAnalysis.targetReason }}</p>
                  </div>

                  <!-- Risk Management -->
                  <div class="bg-white p-4 rounded-lg shadow-sm">
                    <h5 class="font-medium text-red-600 mb-2">風險控管</h5>
                    <p class="text-sm text-gray-700">{{ stock.detailedAnalysis.riskManagement }}</p>
                  </div>
                </div>

                <div v-else class="text-gray-500 text-sm">
                  暫無詳細分析資料
                </div>

                <div class="text-xs text-gray-400">
                  分析日期：{{ stock.analysisDate }}
                </div>
              </div>
            </td>
          </tr>
        </template>
      </tbody>
    </table>
  </div>
</template>
