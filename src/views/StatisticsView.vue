<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { fetchStatistics } from '@/services/statistics'
import { useMarketStore } from '@/stores/market'
import { useDebouncedSymbolSearch } from '@/composables/useDebouncedSymbolSearch'
import PaginationBar from '@/components/PaginationBar.vue'
import { formatDate } from '@/utils/date'
import { getStockLinkUrl, recordKey, formatProbability } from '@/utils/stock'
import type { StatisticsSummary, HistoryRecord, PaginationMeta } from '@/types'
import { BacktestStatus } from '@/types'
const marketStore = useMarketStore()

// 日期範圍限制
const DATA_START_DATE = '2026-01-06'
const today = new Date()

const startDate = ref<string>(DATA_START_DATE)
const endDate = ref<string>(today.toISOString().slice(0, 10))

const maxEndDate = computed(() => {
  const start = new Date(startDate.value)
  start.setMonth(start.getMonth() + 2)
  const max = start > today ? today : start
  return max.toISOString().slice(0, 10)
})

const onStartDateChange = () => {
  if (endDate.value > maxEndDate.value!) {
    endDate.value = maxEndDate.value!
  }
}

// 資料
const loading = ref(false)
const error = ref<string | null>(null)
const isStale = ref(false)
const summary = ref<StatisticsSummary>({ Total: 0, Success: 0, Failed: 0, StopLoss: 0, Pending: 0, SuccessRate: 0 })
const details = ref<HistoryRecord[]>([])
const pagination = ref<PaginationMeta>({ CurrentPage: 1, PageSize: 20, TotalCount: 0, TotalPages: 0 })

const { searchQuery, handleSearchInput } = useDebouncedSymbolSearch()

const fetchData = async (page: number = 1) => {
  loading.value = true
  error.value = null
  try {
    const res = await fetchStatistics(marketStore.currentMarket, startDate.value!, endDate.value!, page, pagination.value.PageSize, searchQuery.value)
    summary.value = res.Summary
    details.value = res.Details
    pagination.value = res.Pagination
    isStale.value = false
  } catch (e) {
    console.error('Failed to load statistics:', e)
    error.value = e instanceof Error ? e.message : '載入失敗，請稍後再試'
  } finally {
    loading.value = false
  }
}

const handleSearch = () => { fetchData(1) }

// 查詢條件變更但尚未重新查詢時提示（market 變更會自動重查，不設 stale）
watch([startDate, endDate, searchQuery], () => {
  isStale.value = true
})

watch(() => marketStore.currentMarket, () => {
  fetchData(1)
})

onMounted(() => { fetchData(1) })

const getStatusInfo = (status?: number) => {
  switch (status) {
    case BacktestStatus.Success:
      return { text: '達標', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' }
    case BacktestStatus.Failed:
      return { text: '未觸發停損停利', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' }
    case BacktestStatus.StopLoss:
      return { text: '停損', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' }
    case BacktestStatus.Pending:
    default:
      return { text: '待回測', color: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400' }
  }
}

// 已完成回測的總數（分母）
const completedTotal = computed(() => summary.value.Total - summary.value.Pending)
const pct = (count: number, denom: number) => denom > 0 ? ((count / denom) * 100).toFixed(1) : '0'

const pieSlices = computed(() => {
  const total = summary.value.Total
  if (total === 0) return []
  const items = [
    { label: '成功達標', count: summary.value.Success, color: '#22c55e' },
    { label: '未觸發停損停利', count: summary.value.Failed, color: '#f97316' },
    { label: '觸發停損', count: summary.value.StopLoss, color: '#ef4444' },
    { label: '待回測', count: summary.value.Pending, color: '#9ca3af' }
  ]
  let cumulative = 0
  return items.map(item => {
    const pct = item.count / total * 100
    const startPct = cumulative
    cumulative += pct
    return { ...item, pct, startPct }
  })
})

const pieGradient = computed(() => {
  if (pieSlices.value.length === 0) return 'conic-gradient(#e5e7eb 0% 100%)'
  const parts = pieSlices.value.map(s => `${s.color} ${s.startPct}% ${s.startPct + s.pct}%`)
  return `conic-gradient(${parts.join(', ')})`
})
</script>

<template>
  <div class="h-full flex flex-col pt-0 transition-colors">
    <div class="flex-1 w-full mx-auto">
      <!-- Page Title -->
      <div class="mb-8 flex justify-between items-center">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">回測統計分析</h1>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">查詢指定區間內推薦的回測結果統計</p>
        </div>
        <router-link to="/" class="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition shadow-sm">
          &larr; 返回儀表板
        </router-link>
      </div>

      <!-- Date Range Picker -->
      <div class="bg-stone-50 dark:bg-gray-800 rounded-lg shadow p-4 mb-4">
        <div class="flex flex-wrap items-center gap-3">
          <span class="text-sm font-medium text-gray-700 dark:text-gray-300">查詢區間</span>
          <div class="inline-flex items-center border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden shadow-sm">
            <input id="startDate" v-model="startDate" type="date"
              :min="DATA_START_DATE" :max="endDate" @change="onStartDateChange"
              class="px-3 py-2 border-0 focus:ring-0 sm:text-sm text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700" />
            <span class="px-2 text-gray-400 bg-gray-50 dark:bg-gray-600 text-sm select-none">~</span>
            <input id="endDate" v-model="endDate" type="date"
              :min="startDate" :max="maxEndDate"
              class="px-3 py-2 border-0 focus:ring-0 sm:text-sm text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700" />
          </div>

          <div class="relative w-full sm:w-48">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg class="h-5 w-5 text-gray-400 dark:text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd" />
              </svg>
            </div>
            <input
              :value="searchQuery"
              @input="handleSearchInput"
              @keyup.enter="handleSearch"
              type="text"
              placeholder="股票代號..."
              class="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors"
            >
          </div>

          <button @click="handleSearch" :disabled="loading"
            class="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium">
            {{ loading ? '查詢中...' : '查詢' }}
          </button>
        </div>
      </div>

      <!-- 警語 -->
      <div class="mb-6 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg flex items-start gap-2">
        <span class="text-amber-500 mt-0.5">⚠️</span>
        <p class="text-sm text-amber-800 dark:text-amber-300">
          回測資料自 <strong>2026/01/06</strong> 起開始收錄，查詢區間最長為 <strong>2 個月</strong>。
        </p>
      </div>

      <!-- Stale Notice -->
      <div v-if="isStale && !loading" class="mb-6 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg flex items-start gap-2">
        <span class="text-amber-500 mt-0.5">ℹ️</span>
        <p class="text-sm text-amber-800 dark:text-amber-300">
          查詢條件已變更，請點「查詢」重新載入結果。
        </p>
      </div>

      <!-- Error State -->
      <div v-if="error" class="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg flex items-center justify-between">
        <p class="text-sm text-red-800 dark:text-red-300">{{ error }}</p>
        <button @click="fetchData(pagination.CurrentPage)"
          class="ml-4 px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition whitespace-nowrap">
          重試
        </button>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="flex justify-center py-12">
        <div class="flex items-center space-x-2">
          <div class="w-4 h-4 bg-blue-600 rounded-full animate-bounce" style="animation-delay: -0.3s"></div>
          <div class="w-4 h-4 bg-blue-600 rounded-full animate-bounce" style="animation-delay: -0.15s"></div>
          <div class="w-4 h-4 bg-blue-600 rounded-full animate-bounce"></div>
        </div>
      </div>

      <template v-else>
        <!-- Summary Cards -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div class="bg-stone-50 dark:bg-gray-800 rounded-lg shadow p-5 border-l-4 border-green-500">
            <p class="text-sm font-medium text-gray-500 dark:text-gray-400">成功達標</p>
            <p class="mt-2 text-3xl font-bold text-green-600 dark:text-green-400">{{ summary.Success }}</p>
            <p class="mt-1 text-xs text-gray-400">{{ pct(summary.Success, completedTotal) }}%</p>
          </div>
          <div class="bg-stone-50 dark:bg-gray-800 rounded-lg shadow p-5 border-l-4 border-orange-500">
            <p class="text-sm font-medium text-gray-500 dark:text-gray-400">未觸發停損停利</p>
            <p class="mt-2 text-3xl font-bold text-orange-600 dark:text-orange-400">{{ summary.Failed }}</p>
            <p class="mt-1 text-xs text-gray-400">{{ pct(summary.Failed, completedTotal) }}%</p>
          </div>
          <div class="bg-stone-50 dark:bg-gray-800 rounded-lg shadow p-5 border-l-4 border-red-500">
            <p class="text-sm font-medium text-gray-500 dark:text-gray-400">觸發停損</p>
            <p class="mt-2 text-3xl font-bold text-red-600 dark:text-red-400">{{ summary.StopLoss }}</p>
            <p class="mt-1 text-xs text-gray-400">{{ pct(summary.StopLoss, completedTotal) }}%</p>
          </div>
          <div class="bg-stone-50 dark:bg-gray-800 rounded-lg shadow p-5 border-l-4 border-gray-400">
            <p class="text-sm font-medium text-gray-500 dark:text-gray-400">待回測</p>
            <p class="mt-2 text-3xl font-bold text-gray-600 dark:text-gray-300">{{ summary.Pending }}</p>
            <p class="mt-1 text-xs text-gray-400">{{ pct(summary.Pending, summary.Total) }}%</p>
          </div>
        </div>

        <!-- Pie Chart -->
        <div class="bg-stone-50 dark:bg-gray-800 rounded-lg shadow p-5 flex flex-col items-center justify-center mb-6">
          <p class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">整體成功率</p>
          <div class="relative w-40 h-40">
            <div class="w-full h-full rounded-full" :style="{ background: pieGradient }"></div>
            <div class="absolute inset-0 flex items-center justify-center">
              <div class="w-24 h-24 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center shadow-inner">
                <span class="text-2xl font-bold text-gray-800 dark:text-white">{{ summary.SuccessRate }}%</span>
              </div>
            </div>
          </div>
          <div class="mt-4 grid grid-cols-2 gap-x-6 gap-y-1 text-xs">
            <div v-for="slice in pieSlices" :key="slice.label" class="flex items-center gap-1.5">
              <span class="w-2.5 h-2.5 rounded-full inline-block" :style="{ backgroundColor: slice.color }"></span>
              <span class="text-gray-600 dark:text-gray-400">{{ slice.label }} ({{ slice.count }})</span>
            </div>
          </div>
        </div>

        <!-- Overall Stats Bar -->
        <div class="bg-stone-50 dark:bg-gray-800 rounded-lg shadow p-4 mb-6 flex items-center justify-between">
          <span class="text-sm text-gray-600 dark:text-gray-400">
            總計 <strong class="text-gray-900 dark:text-white">{{ summary.Total }}</strong> 筆推薦，
            成功率 <strong class="text-green-600 dark:text-green-400">{{ summary.SuccessRate }}%</strong>
          </span>
        </div>

        <!-- Detail Table -->
        <div class="bg-stone-50 dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead class="bg-stone-50 dark:bg-gray-700/50">
                <tr>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">日期</th>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">股票代號</th>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">策略</th>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">推薦價</th>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">目標價</th>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">停損價</th>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">模型勝率</th>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">狀態</th>
                </tr>
              </thead>
              <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                <tr v-if="details.length === 0">
                  <td colspan="8" class="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    {{ summary.Total === 0 ? '該區間內沒有推薦紀錄' : '沒有明細資料' }}
                  </td>
                </tr>
                <tr v-else v-for="record in details" :key="recordKey(record)" class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {{ formatDate(record.RecommendationDate) }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <a :href="getStockLinkUrl(record.StockCode)"
                      target="_blank" rel="noopener noreferrer"
                      class="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                    >{{ record.StockCode }}</a>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span class="text-sm text-gray-900 dark:text-gray-200">{{ record.StrategyType }}</span>
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
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full"
                      :class="getStatusInfo(record.BacktestStatus).color">
                      {{ getStatusInfo(record.BacktestStatus).text }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <PaginationBar
            :current-page="pagination.CurrentPage"
            :total-pages="pagination.TotalPages"
            :page-size="pagination.PageSize"
            :total-count="pagination.TotalCount"
            @change="fetchData"
          />
        </div>
      </template>
    </div>
  </div>
</template>
