<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { fetchHistoryRecords } from '@/services/history'
import { useMarketStore } from '@/stores/market'
import type { HistoryRecord } from '@/types'

const router = useRouter()
const marketStore = useMarketStore()

const stocks = ref<HistoryRecord[]>([])
const loading = ref(true)
const totalCount = ref(0)

async function loadStocks() {
  loading.value = true
  try {
    const res = await fetchHistoryRecords(marketStore.currentMarket, 1, 50)
    if (res && res.Data && res.Data.length > 0) {
      // 只取最新一天的推薦紀錄
      const latestDate = res.Data[0]!.RecommendationDate.split('T')[0]
      stocks.value = res.Data.filter(
        r => r.RecommendationDate.split('T')[0] === latestDate
      )
      totalCount.value = res.Pagination.TotalCount
    }
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

// 格式化日期
const formatDate = (dateString: string) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' })
}
</script>

<template>
  <div class="h-full">
    <!-- Main Content -->
    <div class="w-full">
      <!-- Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div class="text-sm text-gray-500 dark:text-gray-400">最新推薦</div>
          <div class="text-3xl font-bold text-gray-900 dark:text-white">{{ stocks.length }}</div>
          <div class="text-sm text-gray-500 dark:text-gray-400 mt-1">檔股票</div>
        </div>
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div class="text-sm text-gray-500 dark:text-gray-400">推薦總計</div>
          <div class="text-3xl font-bold text-blue-600 dark:text-blue-400">{{ totalCount }}</div>
          <div class="text-sm text-gray-500 dark:text-gray-400 mt-1">筆紀錄</div>
        </div>
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div class="text-sm text-gray-500 dark:text-gray-400">最新日期</div>
          <div class="text-3xl font-bold text-green-600 dark:text-green-400">
            {{ stocks.length > 0 ? formatDate(stocks[0]!.RecommendationDate) : '-' }}
          </div>
          <div class="text-sm text-gray-500 dark:text-gray-400 mt-1">最近一筆推薦</div>
        </div>
      </div>

      <!-- Watchlist Table -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div class="flex justify-between items-center">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">最新推薦列表</h2>
            <!-- Content Options -->
            <div class="flex space-x-1 sm:space-x-4 ml-8">
              <button
                v-for="view in ['dashboard', 'history', 'statistics']"
                :key="view"
                @click="view === 'history' ? router.push('/history') : view === 'statistics' ? router.push('/statistics') : null"
                class="px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer"
                :class="view === 'dashboard'
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'"
              >
                {{ view === 'history' ? '歷史紀錄' : view === 'statistics' ? '回測統計' : '今日推薦' }}
              </button>
            </div>
            <button
              @click="loadStocks"
              :disabled="loading"
              class="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
            >
              重新整理
            </button>
          </div>
        </div>

        <!-- Table Content -->
        <div class="overflow-x-auto">
          <!-- Loading State -->
          <div v-if="loading" class="flex justify-center items-center py-12">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span class="ml-3 text-gray-600 dark:text-gray-400">載入中...</span>
          </div>

          <!-- Empty State -->
          <div v-else-if="stocks.length === 0" class="text-center py-12 text-gray-500 dark:text-gray-400">
            目前沒有推薦紀錄
          </div>

          <!-- Table -->
          <table v-else class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead class="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">日期</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">股票代號</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">策略</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">推薦價</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">目標價</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">停損價</th>
              </tr>
            </thead>
            <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              <tr v-for="(stock, index) in stocks" :key="index" class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {{ formatDate(stock.RecommendationDate) }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <a
                    :href="`https://tw.stock.yahoo.com/quote/${stock.StockCode}/technical-analysis`"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium text-sm"
                  >
                    {{ stock.StockCode }}
                  </a>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="text-sm text-gray-900 dark:text-gray-200">{{ stock.StrategyType }}</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300 font-medium">
                  ${{ stock.BuyPoint }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-green-600 dark:text-green-400 font-semibold">
                  ${{ stock.SellPoint }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-red-500 dark:text-red-400">
                  ${{ stock.SuggestedExitPoint }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Disclaimer -->
      <div class="mt-8 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg">
        <p class="text-sm text-yellow-800 dark:text-yellow-300">
          <strong>警語：</strong>本分析僅供參考，不代表投資建議。股市投資有風險，進場前請務必衡量自身風險承受度。
        </p>
      </div>
    </div>
  </div>
</template>
