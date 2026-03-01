<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { fetchHistoryRecords } from '@/services/history'
import { useMarketStore } from '@/stores/market'
import type { HistoryRecord } from '@/types'
const marketStore = useMarketStore()

const loading = ref(true)
const records = ref<HistoryRecord[]>([])
const currentPage = ref(1)
const pageSize = ref(10)
const totalItems = ref(0)
const totalPages = ref(0)

const fetchPage = async (page: number) => {
  loading.value = true
  try {
    const res = await fetchHistoryRecords(marketStore.currentMarket, page, pageSize.value)
    if (res && res.Data) {
      records.value = res.Data
      totalItems.value = res.Pagination.TotalCount
      totalPages.value = res.Pagination.TotalPages
      currentPage.value = res.Pagination.CurrentPage
    }
  } catch (error) {
    console.error('Failed to load history:', error)
  } finally {
    loading.value = false
  }
}

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    fetchPage(currentPage.value + 1)
  }
}

const prevPage = () => {
  if (currentPage.value > 1) {
    fetchPage(currentPage.value - 1)
  }
}

watch(() => marketStore.currentMarket, () => {
  fetchPage(1)
})

onMounted(() => {
  fetchPage(1)
})

const formatDate = (dateString: string) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' })
}
</script>

<template>
  <div class="h-full flex flex-col pt-0 transition-colors">
    <div class="flex-1 w-full mx-auto">
      <div class="mb-8 flex justify-between items-center">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">歷史推薦紀錄</h1>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">檢視過去所有的 AI 股票推薦紀錄與績效狀態</p>
        </div>
        <router-link to="/" class="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition shadow-sm">
          &larr; 返回儀表板
        </router-link>
      </div>

      <!-- Table Section -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead class="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">日期</th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">股票代號</th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">選股策略</th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">推薦價</th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">目標價</th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">停損價</th>
              </tr>
            </thead>
            <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              <tr v-if="loading">
                <td colspan="6" class="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                  <div class="flex justify-center items-center space-x-2">
                    <div class="w-4 h-4 bg-blue-600 rounded-full animate-bounce" style="animation-delay: -0.3s"></div>
                    <div class="w-4 h-4 bg-blue-600 rounded-full animate-bounce" style="animation-delay: -0.15s"></div>
                    <div class="w-4 h-4 bg-blue-600 rounded-full animate-bounce"></div>
                  </div>
                  <span class="mt-2 block text-sm">載入中...</span>
                </td>
              </tr>
              <tr v-else-if="records.length === 0">
                <td colspan="6" class="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                  目前沒有歷史紀錄
                </td>
              </tr>
              <tr v-else v-for="(record, index) in records" :key="index" class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {{ formatDate(record.RecommendationDate) }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <a
                    :href="`https://tw.stock.yahoo.com/quote/${record.StockCode}/technical-analysis`"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                  >{{ record.StockCode }}</a>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="text-sm text-gray-900 dark:text-gray-200">{{ record.StrategyType }}</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  ${{ record.BuyPoint }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-green-600 dark:text-green-400 font-semibold">
                  ${{ record.SellPoint }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-red-500 dark:text-red-400">
                  ${{ record.SuggestedExitPoint }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div v-if="totalPages > 1" class="bg-white dark:bg-gray-800 px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between sm:px-6">
          <div class="flex-1 flex justify-between sm:hidden">
            <button @click="prevPage" :disabled="currentPage === 1"
              class="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed">
              前一頁
            </button>
            <button @click="nextPage" :disabled="currentPage === totalPages"
              class="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed">
              下一頁
            </button>
          </div>
          <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p class="text-sm text-gray-700 dark:text-gray-300">
                顯示第 <span class="font-medium">{{ (currentPage - 1) * pageSize + 1 }}</span>
                至 <span class="font-medium">{{ Math.min(currentPage * pageSize, totalItems) }}</span>
                筆，共 <span class="font-medium">{{ totalItems }}</span> 筆紀錄
              </p>
            </div>
            <div>
              <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button @click="prevPage" :disabled="currentPage === 1"
                  class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed">
                  <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" />
                  </svg>
                </button>
                <button
                  v-for="page in totalPages"
                  :key="page"
                  @click="fetchPage(page)"
                  :class="[
                    page === currentPage
                      ? 'z-10 bg-blue-50 dark:bg-blue-900/30 border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600',
                    'relative inline-flex items-center px-4 py-2 border text-sm font-medium'
                  ]"
                >
                  {{ page }}
                </button>
                <button @click="nextPage" :disabled="currentPage === totalPages"
                  class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed">
                  <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
                  </svg>
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
