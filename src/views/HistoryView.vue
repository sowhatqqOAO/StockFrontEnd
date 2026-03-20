<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { fetchHistoryRecords } from '@/services/history'
import { useMarketStore } from '@/stores/market'
import { useRealTimePrice } from '@/composables/useRealTimePrice'
import type { HistoryRecord } from '@/types'
const marketStore = useMarketStore()
const { currentPrices, isLoadingPrices, fetchPrices } = useRealTimePrice()

const loading = ref(true)
const records = ref<HistoryRecord[]>([])
const currentPage = ref(1)
const pageSize = ref(10)
const totalItems = ref(0)
const totalPages = ref(0)
const expandedRows = ref<Set<number>>(new Set())

const searchQuery = ref('')
let searchTimeout: ReturnType<typeof setTimeout> | null = null

const handleSearchInput = (e: Event) => {
  const target = e.target as HTMLInputElement
  const filtered = target.value.replace(/[^a-zA-Z0-9.]/g, '').toUpperCase()
  searchQuery.value = filtered
  
  if (target.value !== filtered) {
    target.value = filtered
  }

  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    fetchPage(1)
  }, 500)
}

const toggleExpand = (index: number) => {
  const newSet = new Set(expandedRows.value)
  if (newSet.has(index)) {
    newSet.delete(index)
  } else {
    newSet.add(index)
  }
  expandedRows.value = newSet
}

const fetchPage = async (page: number) => {
  expandedRows.value.clear()
  loading.value = true
  try {
    const res = await fetchHistoryRecords(marketStore.currentMarket, page, pageSize.value, searchQuery.value)
    if (res && res.Data) {
      records.value = res.Data
      totalItems.value = res.Pagination.TotalCount
      totalPages.value = res.Pagination.TotalPages
      currentPage.value = res.Pagination.CurrentPage

      // Fetch prices for the visible records
      const symbols = records.value.map(r => r.StockCode)
      // fetchPrices is async but we don't need to await it here, let it load in the background
      fetchPrices(symbols)
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

// Fixed 5-page window
const visiblePages = computed<number[]>(() => {
  const total = totalPages.value
  const cur = currentPage.value
  const winStart = Math.max(1, Math.min(cur, total - 4))
  const winEnd = Math.min(total, winStart + 4)
  return Array.from({ length: winEnd - winStart + 1 }, (_, i) => winStart + i)
})
const showFirstBtn = computed(() => visiblePages.value.length > 0 && visiblePages.value[0]! > 1)
const showLastBtn = computed(() => visiblePages.value.length > 0 && visiblePages.value[visiblePages.value.length - 1]! < totalPages.value)

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
      <div class="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">歷史推薦紀錄</h1>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">檢視過去所有的 AI 股票推薦紀錄與績效狀態</p>
        </div>
        <div class="flex items-center gap-4 w-full sm:w-auto">
          <div class="relative w-full sm:w-64">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg class="h-5 w-5 text-gray-400 dark:text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd" />
              </svg>
            </div>
            <input 
              :value="searchQuery"
              @input="handleSearchInput"
              type="text" 
              placeholder="搜尋股票代號..." 
              class="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors"
            >
          </div>
          <router-link to="/" class="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition shadow-sm whitespace-nowrap">
            &larr; 返回儀表板
          </router-link>
        </div>
      </div>

      <!-- Disclaimer -->
      <div class="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg">
        <p class="text-sm text-yellow-800 dark:text-yellow-300">
          <strong>警語：</strong>本分析僅供參考，不代表投資建議。股市投資有風險，進場前請務必衡量自身風險承受度。
        </p>
      </div>

      <!-- Table Section -->
      <div class="bg-stone-50 dark:bg-gray-800 rounded-lg shadow overflow-hidden">
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
                <th scope="col" class="px-6 py-3 relative"><span class="sr-only">詳細</span></th>
              </tr>
            </thead>
            <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              <tr v-if="loading">
                <td colspan="7" class="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                  <div class="flex justify-center items-center space-x-2">
                    <div class="w-4 h-4 bg-blue-600 rounded-full animate-bounce" style="animation-delay: -0.3s"></div>
                    <div class="w-4 h-4 bg-blue-600 rounded-full animate-bounce" style="animation-delay: -0.15s"></div>
                    <div class="w-4 h-4 bg-blue-600 rounded-full animate-bounce"></div>
                  </div>
                  <span class="mt-2 block text-sm">載入中...</span>
                </td>
              </tr>
              <tr v-else-if="records.length === 0">
                <td colspan="7" class="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                  目前沒有歷史紀錄
                </td>
              </tr>
              <template v-else v-for="(record, index) in records" :key="index">
                <tr @click="toggleExpand(index)" class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer group">
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
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium" title="點擊展開 AI 分析">
                  <div class="flex items-center justify-end text-gray-400 group-hover:text-blue-500 transition-colors">
                    <span v-if="record.AiComment" class="mr-2 text-xs font-semibold bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300 px-2 py-0.5 rounded-full">AI 分析</span>
                    <button>
                      <svg :class="{'rotate-180': expandedRows.has(index)}" class="h-5 w-5 transform transition-transform duration-200" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </td>
                </tr>
                <!-- Expanded Row for AI Comment -->
                <tr v-if="expandedRows.has(index)" class="bg-indigo-50/30 dark:bg-indigo-900/10 border-b-2 border-indigo-100 dark:border-indigo-900/30">
                  <td colspan="7" class="px-6 py-4">
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
                <!-- Jump to first page -->
                <button v-if="showFirstBtn" @click="fetchPage(1)"
                  class="relative inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-600">
                  ⇤ 1
                </button>
                <!-- 5-page window -->
                <button
                  v-for="page in visiblePages"
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
                <!-- Jump to last page -->
                <button v-if="showLastBtn" @click="fetchPage(totalPages)"
                  class="relative inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-600">
                  {{ totalPages }} ⇥
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
