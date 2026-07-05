<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { fetchHistoryRecords } from '@/services/history'
import { useMarketStore } from '@/stores/market'
import { useRealTimePrice } from '@/composables/useRealTimePrice'
import RecommendationTable from '@/components/RecommendationTable.vue'
import Disclaimer from '@/components/Disclaimer.vue'
import { formatDate } from '@/utils/date'
import type { HistoryRecord } from '@/types'

const marketStore = useMarketStore()
const { currentPrices, isLoadingPrices, fetchPrices } = useRealTimePrice()

const stocks = ref<HistoryRecord[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const totalCount = ref(0)

async function loadStocks() {
  loading.value = true
  error.value = null
  try {
    const res = await fetchHistoryRecords(marketStore.currentMarket, 1, 50)
    if (res.Data.length > 0) {
      // 只取最新一天的推薦紀錄
      const latestDate = res.Data[0]!.RecommendationDate.split('T')[0]
      stocks.value = res.Data.filter(
        r => r.RecommendationDate.split('T')[0] === latestDate
      )
      totalCount.value = res.Pagination.TotalCount

      // 取得即時報價
      fetchPrices(stocks.value.map(s => s.StockCode))
    } else {
      stocks.value = []
      totalCount.value = 0
    }
  } catch (e) {
    console.error('Failed to load recommendations:', e)
    error.value = e instanceof Error ? e.message : '載入失敗，請稍後再試'
    stocks.value = []
  } finally {
    loading.value = false
  }
}

watch(() => marketStore.currentMarket, () => {
  loadStocks()
})

onMounted(() => {
  loadStocks()
})
</script>

<template>
  <div class="h-full">
    <!-- Main Content -->
    <div class="w-full">
      <!-- Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-6">
          <div class="text-sm text-gray-500 dark:text-gray-400">最新推薦</div>
          <div class="text-3xl font-bold text-gray-900 dark:text-white">{{ stocks.length }}</div>
          <div class="text-sm text-gray-500 dark:text-gray-400 mt-1">檔股票</div>
        </div>
        <div class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-6">
          <div class="text-sm text-gray-500 dark:text-gray-400">推薦總計</div>
          <div class="text-3xl font-bold text-blue-600 dark:text-blue-400">{{ totalCount }}</div>
          <div class="text-sm text-gray-500 dark:text-gray-400 mt-1">筆紀錄</div>
        </div>
        <div class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-6">
          <div class="text-sm text-gray-500 dark:text-gray-400">最新日期</div>
          <div class="text-3xl font-bold text-green-600 dark:text-green-400">
            {{ stocks.length > 0 ? formatDate(stocks[0]!.RecommendationDate) : '-' }}
          </div>
          <div class="text-sm text-gray-500 dark:text-gray-400 mt-1">最近一筆推薦</div>
        </div>
      </div>

      <Disclaimer />

      <!-- Error State -->
      <div v-if="error" class="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg flex items-center justify-between">
        <p class="text-sm text-red-800 dark:text-red-300">{{ error }}</p>
        <button @click="loadStocks"
          class="ml-4 px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition whitespace-nowrap">
          重試
        </button>
      </div>

      <!-- Watchlist Table -->
      <div class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
        <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div class="flex justify-between items-center">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">最新推薦列表</h2>
            <button
              @click="loadStocks"
              :disabled="loading"
              class="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
            >
              重新整理
            </button>
          </div>
        </div>

        <RecommendationTable
          :records="stocks"
          :loading="loading"
          empty-text="目前沒有推薦紀錄"
          :current-prices="currentPrices"
          :is-loading-prices="isLoadingPrices"
        />
      </div>
    </div>
  </div>
</template>
