<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { fetchHistoryRecords } from '@/services/history'
import { useMarketStore } from '@/stores/market'
import { useRealTimePrice } from '@/composables/useRealTimePrice'
import { useDebouncedSymbolSearch } from '@/composables/useDebouncedSymbolSearch'
import RecommendationTable from '@/components/RecommendationTable.vue'
import PaginationBar from '@/components/PaginationBar.vue'
import Disclaimer from '@/components/Disclaimer.vue'
import type { HistoryRecord } from '@/types'

const marketStore = useMarketStore()
const { currentPrices, isLoadingPrices, fetchPrices } = useRealTimePrice()

const loading = ref(true)
const error = ref<string | null>(null)
const records = ref<HistoryRecord[]>([])
const currentPage = ref(1)
const pageSize = ref(10)
const totalItems = ref(0)
const totalPages = ref(0)

const { searchQuery, handleSearchInput } = useDebouncedSymbolSearch(() => fetchPage(1))

const fetchPage = async (page: number) => {
  loading.value = true
  error.value = null
  try {
    const res = await fetchHistoryRecords(marketStore.currentMarket, page, pageSize.value, searchQuery.value)
    records.value = res.Data
    totalItems.value = res.Pagination.TotalCount
    totalPages.value = res.Pagination.TotalPages
    currentPage.value = res.Pagination.CurrentPage

    // Fetch prices for the visible records (background, no await)
    fetchPrices(records.value.map(r => r.StockCode))
  } catch (e) {
    console.error('Failed to load history:', e)
    error.value = e instanceof Error ? e.message : '載入失敗，請稍後再試'
    records.value = []
  } finally {
    loading.value = false
  }
}

watch(() => marketStore.currentMarket, () => {
  fetchPage(1)
})

onMounted(() => {
  fetchPage(1)
})
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
              class="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg leading-5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors"
            >
          </div>
        </div>
      </div>

      <Disclaimer />

      <!-- Error State -->
      <div v-if="error" class="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg flex items-center justify-between">
        <p class="text-sm text-red-800 dark:text-red-300">{{ error }}</p>
        <button @click="fetchPage(currentPage)"
          class="ml-4 px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition whitespace-nowrap">
          重試
        </button>
      </div>

      <!-- Table Section -->
      <div class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
        <RecommendationTable
          :records="records"
          :loading="loading"
          empty-text="目前沒有歷史紀錄"
          :current-prices="currentPrices"
          :is-loading-prices="isLoadingPrices"
        />
        <PaginationBar
          :current-page="currentPage"
          :total-pages="totalPages"
          :page-size="pageSize"
          :total-count="totalItems"
          @change="fetchPage"
        />
      </div>
    </div>
  </div>
</template>
