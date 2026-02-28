<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { fetchStatistics } from '@/services/statistics'
import type { StatisticsSummary, HistoryRecord, PaginationMeta } from '@/types'
import { BacktestStatus } from '@/types'
import { useDarkMode } from '@/composables/useDarkMode'

const router = useRouter()
const authStore = useAuthStore()
const { isDark, toggle: toggleDark } = useDarkMode()

const handleLogout = () => {
  authStore.logout()
  router.push('/login')
}

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
const summary = ref<StatisticsSummary>({ Total: 0, Success: 0, Failed: 0, StopLoss: 0, Pending: 0, SuccessRate: 0 })
const details = ref<HistoryRecord[]>([])
const pagination = ref<PaginationMeta>({ CurrentPage: 1, PageSize: 20, TotalCount: 0, TotalPages: 0 })

const fetchData = async (page: number = 1) => {
  loading.value = true
  try {
    const res = await fetchStatistics(startDate.value!, endDate.value!, page, pagination.value.PageSize)
    summary.value = res.Summary
    details.value = res.Details
    pagination.value = res.Pagination
  } catch (error) {
    console.error('Failed to load statistics:', error)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => { fetchData(1) }
const nextPage = () => { if (pagination.value.CurrentPage < pagination.value.TotalPages) fetchData(pagination.value.CurrentPage + 1) }
const prevPage = () => { if (pagination.value.CurrentPage > 1) fetchData(pagination.value.CurrentPage - 1) }

onMounted(() => { fetchData(1) })

const formatDate = (dateString: string) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

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
  <div class="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col pt-0 transition-colors">
    <!-- Header -->
    <header class="bg-white dark:bg-gray-800 shadow z-10">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div class="flex justify-between items-center">
          <router-link to="/" class="text-2xl font-bold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition cursor-pointer">股票觀察系統</router-link>
          <div class="flex items-center gap-4">
            <button @click="toggleDark" class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition text-gray-600 dark:text-gray-300" title="切換深色模式">
              <svg v-if="isDark" class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clip-rule="evenodd"/></svg>
              <svg v-else class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"/></svg>
            </button>
            <span class="text-gray-600 dark:text-gray-300">
              歡迎，{{ authStore.user?.username ?? '訪客' }}
            </span>
            <button @click="handleLogout"
              class="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition">
              登出
            </button>
          </div>
        </div>
      </div>
    </header>

    <main class="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-4">
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
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-5 border-l-4 border-green-500">
            <p class="text-sm font-medium text-gray-500 dark:text-gray-400">成功達標</p>
            <p class="mt-2 text-3xl font-bold text-green-600 dark:text-green-400">{{ summary.Success }}</p>
            <p class="mt-1 text-xs text-gray-400">{{ (summary.Total - summary.Pending) > 0 ? ((summary.Success / (summary.Total - summary.Pending)) * 100).toFixed(1) : 0 }}%</p>
          </div>
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-5 border-l-4 border-orange-500">
            <p class="text-sm font-medium text-gray-500 dark:text-gray-400">未觸發停損停利</p>
            <p class="mt-2 text-3xl font-bold text-orange-600 dark:text-orange-400">{{ summary.Failed }}</p>
            <p class="mt-1 text-xs text-gray-400">{{ (summary.Total - summary.Pending) > 0 ? ((summary.Failed / (summary.Total - summary.Pending)) * 100).toFixed(1) : 0 }}%</p>
          </div>
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-5 border-l-4 border-red-500">
            <p class="text-sm font-medium text-gray-500 dark:text-gray-400">觸發停損</p>
            <p class="mt-2 text-3xl font-bold text-red-600 dark:text-red-400">{{ summary.StopLoss }}</p>
            <p class="mt-1 text-xs text-gray-400">{{ (summary.Total - summary.Pending) > 0 ? ((summary.StopLoss / (summary.Total - summary.Pending)) * 100).toFixed(1) : 0 }}%</p>
          </div>
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-5 border-l-4 border-gray-400">
            <p class="text-sm font-medium text-gray-500 dark:text-gray-400">待回測</p>
            <p class="mt-2 text-3xl font-bold text-gray-600 dark:text-gray-300">{{ summary.Pending }}</p>
            <p class="mt-1 text-xs text-gray-400">{{ summary.Total > 0 ? ((summary.Pending / summary.Total) * 100).toFixed(1) : 0 }}%</p>
          </div>
        </div>

        <!-- Pie Chart -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-5 flex flex-col items-center justify-center mb-6">
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
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6 flex items-center justify-between">
          <span class="text-sm text-gray-600 dark:text-gray-400">
            總計 <strong class="text-gray-900 dark:text-white">{{ summary.Total }}</strong> 筆推薦，
            成功率 <strong class="text-green-600 dark:text-green-400">{{ summary.SuccessRate }}%</strong>
          </span>
        </div>

        <!-- Detail Table -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead class="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">日期</th>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">股票代號</th>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">策略</th>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">推薦價</th>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">目標價</th>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">停損價</th>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">狀態</th>
                </tr>
              </thead>
              <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                <tr v-if="details.length === 0">
                  <td colspan="7" class="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    {{ summary.Total === 0 ? '該區間內沒有推薦紀錄' : '沒有明細資料' }}
                  </td>
                </tr>
                <tr v-else v-for="(record, index) in details" :key="index" class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {{ formatDate(record.RecommendationDate) }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <a :href="`https://tw.stock.yahoo.com/quote/${record.StockCode}/technical-analysis`"
                      target="_blank" rel="noopener noreferrer"
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

          <!-- Pagination -->
          <div v-if="pagination.TotalPages > 1" class="bg-white dark:bg-gray-800 px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between sm:px-6">
            <div class="flex-1 flex justify-between sm:hidden">
              <button @click="prevPage" :disabled="pagination.CurrentPage === 1"
                class="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed">
                前一頁
              </button>
              <button @click="nextPage" :disabled="pagination.CurrentPage === pagination.TotalPages"
                class="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed">
                下一頁
              </button>
            </div>
            <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <p class="text-sm text-gray-700 dark:text-gray-300">
                顯示第 <span class="font-medium">{{ (pagination.CurrentPage - 1) * pagination.PageSize + 1 }}</span>
                至 <span class="font-medium">{{ Math.min(pagination.CurrentPage * pagination.PageSize, pagination.TotalCount) }}</span>
                筆，共 <span class="font-medium">{{ pagination.TotalCount }}</span> 筆紀錄
              </p>
              <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button @click="prevPage" :disabled="pagination.CurrentPage === 1"
                  class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed">
                  <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" />
                  </svg>
                </button>
                <button v-for="page in pagination.TotalPages" :key="page" @click="fetchData(page)"
                  :class="[
                    page === pagination.CurrentPage
                      ? 'z-10 bg-blue-50 dark:bg-blue-900/30 border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600',
                    'relative inline-flex items-center px-4 py-2 border text-sm font-medium'
                  ]">
                  {{ page }}
                </button>
                <button @click="nextPage" :disabled="pagination.CurrentPage === pagination.TotalPages"
                  class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed">
                  <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
                  </svg>
                </button>
              </nav>
            </div>
          </div>
        </div>
      </template>
    </main>
  </div>
</template>
