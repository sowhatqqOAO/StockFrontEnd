<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { fetchStatistics } from '@/services/statistics'
import { useMarketStore } from '@/stores/market'
import { useDebouncedSymbolSearch } from '@/composables/useDebouncedSymbolSearch'
import PaginationBar from '@/components/PaginationBar.vue'
import InfoTooltip from '@/components/InfoTooltip.vue'
import CollapsibleSection from '@/components/CollapsibleSection.vue'
import EquityCurveChart from '@/components/charts/EquityCurveChart.vue'
import MonthlyExpectancyChart from '@/components/charts/MonthlyExpectancyChart.vue'
import CalibrationChart from '@/components/charts/CalibrationChart.vue'
import { formatDate } from '@/utils/date'
import { getStockLinkUrl, recordKey, formatProbability, formatPnl, pnlColorClass, getStatusInfo } from '@/utils/stock'
import type { StatisticsSummary, HistoryRecord, PaginationMeta } from '@/types'
const marketStore = useMarketStore()

// 日期範圍限制：資料自 DATA_START_DATE 起收錄，查詢區間最長 2 個月
const DATA_START_DATE = '2026-01-06'
const today = new Date()
const toISODate = (d: Date) => d.toISOString().slice(0, 10)

// 預設起始日 = 今天 - 2 個月（不得早於資料收錄起始日）
const defaultStart = new Date(today)
defaultStart.setMonth(defaultStart.getMonth() - 2)
const defaultStartStr = toISODate(defaultStart) < DATA_START_DATE ? DATA_START_DATE : toISODate(defaultStart)

const startDate = ref<string>(defaultStartStr)
const endDate = ref<string>(toISODate(today))

const maxEndDate = computed(() => {
  const start = new Date(startDate.value)
  start.setMonth(start.getMonth() + 2)
  const max = start > today ? today : start
  return toISODate(max)
})

// 改起始日：結束日超出 2 個月上限時往回拉
const onStartDateChange = () => {
  if (endDate.value > maxEndDate.value!) {
    endDate.value = maxEndDate.value!
  }
}

// 改結束日：起始日早於（結束日 - 2 個月）時往前推，鎖定區間最長 2 個月
const onEndDateChange = () => {
  const minStart = new Date(endDate.value)
  minStart.setMonth(minStart.getMonth() - 2)
  const minStartStr = toISODate(minStart)
  if (startDate.value < minStartStr) {
    startDate.value = minStartStr < DATA_START_DATE ? DATA_START_DATE : minStartStr
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

// 圖表用全量資料（分頁表格只有一頁，圖表需要區間內全部記錄）
const chartRecords = ref<HistoryRecord[]>([])

const fetchData = async (page: number = 1) => {
  loading.value = true
  error.value = null
  try {
    const res = await fetchStatistics(marketStore.currentMarket, startDate.value!, endDate.value!, page, pagination.value.PageSize, searchQuery.value)
    summary.value = res.Summary
    details.value = res.Details
    pagination.value = res.Pagination
    isStale.value = false

    // 背景抓圖表全量資料（首頁載入時；翻頁不重抓）
    if (page === 1) {
      fetchStatistics(marketStore.currentMarket, startDate.value!, endDate.value!, 1, 500, searchQuery.value)
        .then(full => { chartRecords.value = full.Details })
        .catch(e => console.error('Failed to load chart data:', e))
    }
  } catch (e) {
    console.error('Failed to load statistics:', e)
    error.value = e instanceof Error ? e.message : '載入失敗，請稍後再試'
  } finally {
    loading.value = false
  }
}

// KPI 格式化：null = 無成交樣本顯示 '-'；賺賠比/獲利因子在零虧損時數學上為 ∞
const fmtKpi = (v: number | null | undefined, suffix = '') =>
  v === null || v === undefined ? '-' : `${v > 0 && suffix === '%' ? '+' : ''}${v.toFixed(2)}${suffix}`
const fmtRatio = (v: number | null | undefined) => {
  if (v !== null && v !== undefined) return v.toFixed(2)
  // 有獲利樣本但比值為 null → 零虧損樣本 → ∞
  return summary.value.AvgWinPercent != null ? '∞' : '-'
}
const fillRate = computed(() => {
  const denom = summary.value.Total - summary.value.Pending
  const filled = summary.value.FilledCount
  if (!denom || filled === null || filled === undefined) return null
  return Math.round((filled / denom) * 100)
})

const handleSearch = () => { fetchData(1) }

// 查詢條件變更但尚未重新查詢時提示（market 變更會自動重查，不設 stale）
watch([startDate, endDate, searchQuery], () => {
  isStale.value = true
})

watch(() => marketStore.currentMarket, () => {
  fetchData(1)
})

onMounted(() => { fetchData(1) })

// 已完成回測的總數（分母）
const completedTotal = computed(() => summary.value.Total - summary.value.Pending)
const pct = (count: number, denom: number) => denom > 0 ? ((count / denom) * 100).toFixed(1) : '0'

const pieSlices = computed(() => {
  const total = summary.value.Total
  if (total === 0) return []
  const items = [
    { label: '成功達標', count: summary.value.Success, color: '#22c55e' },
    { label: '到期出場', count: summary.value.Failed, color: '#f97316' },
    { label: '觸發停損', count: summary.value.StopLoss, color: '#ef4444' },
    { label: '未成交', count: summary.value.NotTriggered ?? 0, color: '#64748b' },
    { label: '驗證中', count: summary.value.Pending, color: '#9ca3af' }
  ].filter(i => i.count > 0)
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
      </div>

      <!-- Date Range Picker -->
      <div class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-4 mb-4">
        <div class="flex flex-wrap items-center gap-3">
          <span class="text-sm font-medium text-gray-700 dark:text-gray-300">查詢區間</span>
          <div class="inline-flex items-center border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden shadow-sm">
            <input id="startDate" v-model="startDate" type="date"
              :min="DATA_START_DATE" :max="endDate" @change="onStartDateChange"
              class="px-3 py-2 border-0 focus:ring-0 sm:text-sm text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800" />
            <span class="px-2 text-gray-400 bg-gray-50 dark:bg-gray-600 text-sm select-none">~</span>
            <input id="endDate" v-model="endDate" type="date"
              :min="startDate" :max="maxEndDate" @change="onEndDateChange"
              class="px-3 py-2 border-0 focus:ring-0 sm:text-sm text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800" />
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
              class="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg leading-5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors"
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
        <!-- KPI 卡片列（期望值指標） -->
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
          <!-- 每筆期望值（最重要） -->
          <div class="bg-white dark:bg-gray-900 rounded-xl border-2 shadow-sm p-5"
            :class="(summary.Expectancy ?? 0) > 0 ? 'border-green-500' : (summary.Expectancy ?? 0) < 0 ? 'border-red-500' : 'border-gray-200 dark:border-gray-800'">
            <p class="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1">
              每筆期望值 ★
              <InfoTooltip text="每做一筆交易平均賺賠多少 %。這是最重要的指標：只要為正，長期就是賺錢的策略，即使勝率低也一樣。" />
            </p>
            <p class="mt-2 text-3xl font-bold"
              :class="(summary.Expectancy ?? 0) > 0 ? 'text-green-600 dark:text-green-400' : (summary.Expectancy ?? 0) < 0 ? 'text-red-500 dark:text-red-400' : 'text-gray-600 dark:text-gray-300'">
              {{ fmtKpi(summary.Expectancy, '%') }}
            </p>
            <p class="mt-1 text-xs text-gray-400">平均每筆交易損益</p>
          </div>
          <!-- 獲利因子 -->
          <div class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-5">
            <p class="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1">
              獲利因子
              <InfoTooltip text="所有獲利交易的總和 ÷ 所有虧損交易的總和。大於 1 代表整體賺錢，小於 1 代表賠錢；1.5 以上通常視為穩健。" />
            </p>
            <p class="mt-2 text-3xl font-bold"
              :class="summary.ProfitFactor == null ? 'text-gray-600 dark:text-gray-300' : summary.ProfitFactor >= 1 ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'">
              {{ fmtRatio(summary.ProfitFactor) }}
            </p>
            <p class="mt-1 text-xs text-gray-400">總獲利 ÷ 總虧損</p>
          </div>
          <!-- 賺賠比 -->
          <div class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-5">
            <p class="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1">
              賺賠比
              <InfoTooltip text="平均一筆賺錢交易的獲利，是平均一筆賠錢交易虧損的幾倍。2 代表賺的時候平均賺的是賠的時候的兩倍。" />
            </p>
            <p class="mt-2 text-3xl font-bold text-gray-800 dark:text-gray-100">{{ fmtRatio(summary.PayoffRatio) }}</p>
            <p class="mt-1 text-xs text-gray-400">平均獲利 ÷ 平均虧損</p>
          </div>
          <!-- 平均獲利／虧損 -->
          <div class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-5">
            <p class="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1">
              平均獲利／虧損
              <InfoTooltip text="左邊是所有賺錢交易的平均獲利 %，右邊是所有賠錢交易的平均虧損 %。用來看單筆的賺賠幅度。" />
            </p>
            <p class="mt-2 text-2xl font-bold">
              <span class="text-green-600 dark:text-green-400">{{ fmtKpi(summary.AvgWinPercent, '%') }}</span>
              <span class="text-gray-400 mx-1">/</span>
              <span class="text-red-500 dark:text-red-400">{{ fmtKpi(summary.AvgLossPercent, '%') }}</span>
            </p>
            <p class="mt-1 text-xs text-gray-400">獲利與虧損交易的平均</p>
          </div>
          <!-- 成交率 -->
          <div class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-5"
            :title="`未成交 ${summary.NotTriggered ?? 0} 筆（股價未回到買點）`">
            <p class="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1">
              成交率
              <InfoTooltip text="推薦後股價實際回到買點、交易成立的比例。未成交代表股價一路上漲從未回檔到買點，交易並不存在，不計入勝率。" />
            </p>
            <p class="mt-2 text-3xl font-bold text-gray-800 dark:text-gray-100">{{ fillRate === null ? '-' : `${fillRate}%` }}</p>
            <p class="mt-1 text-xs text-gray-400">未成交 {{ summary.NotTriggered ?? 0 }} 筆</p>
          </div>
        </div>

        <!-- 狀態分布（次要，預設收合） -->
        <CollapsibleSection title="狀態分布" :default-open="false">
        <!-- Summary Cards -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-5 border-l-4 border-green-500">
            <p class="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1">
              成功達標
              <InfoTooltip text="回測期間內股價觸及目標停利價的推薦筆數。" />
            </p>
            <p class="mt-2 text-3xl font-bold text-green-600 dark:text-green-400">{{ summary.Success }}</p>
            <p class="mt-1 text-xs text-gray-400">{{ pct(summary.Success, completedTotal) }}%</p>
          </div>
          <div class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-5 border-l-4 border-orange-500">
            <p class="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1">
              未觸發停損停利
              <InfoTooltip text="到回測期限（10 個交易日）結束前，股價既沒觸及停利也沒觸及停損，依到期當天價格計算損益（可能小賺或小賠）。" />
            </p>
            <p class="mt-2 text-3xl font-bold text-orange-600 dark:text-orange-400">{{ summary.Failed }}</p>
            <p class="mt-1 text-xs text-gray-400">{{ pct(summary.Failed, completedTotal) }}%</p>
          </div>
          <div class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-5 border-l-4 border-red-500">
            <p class="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1">
              觸發停損
              <InfoTooltip text="回測期間內股價跌到建議停損價、觸發出場的推薦筆數。" />
            </p>
            <p class="mt-2 text-3xl font-bold text-red-600 dark:text-red-400">{{ summary.StopLoss }}</p>
            <p class="mt-1 text-xs text-gray-400">{{ pct(summary.StopLoss, completedTotal) }}%</p>
          </div>
          <div class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-5 border-l-4 border-gray-400">
            <p class="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1">
              待回測
              <InfoTooltip text="推薦後尚未滿 10 個交易日、回測結果還沒出爐的筆數，不列入勝率與期望值計算。" />
            </p>
            <p class="mt-2 text-3xl font-bold text-gray-600 dark:text-gray-300">{{ summary.Pending }}</p>
            <p class="mt-1 text-xs text-gray-400">{{ pct(summary.Pending, summary.Total) }}%</p>
          </div>
        </div>

        <!-- Pie Chart -->
        <div class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-5 flex flex-col items-center justify-center mb-6">
          <p class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3 flex items-center gap-1">
            整體成功率
            <InfoTooltip text="已回測交易中觸及停利價的比例（分母不含驗證中與未成交）。注意：成功率與期望值方向可能不一致——勝率低但賺賠比高也能整體賺錢。" />
          </p>
          <div class="relative w-40 h-40">
            <div class="w-full h-full rounded-full" :style="{ background: pieGradient }"></div>
            <div class="absolute inset-0 flex items-center justify-center">
              <div class="w-24 h-24 bg-white dark:bg-gray-900 rounded-full flex items-center justify-center shadow-inner">
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
        <div class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-4 mb-6 flex items-center justify-between">
          <span class="text-sm text-gray-600 dark:text-gray-400">
            總計 <strong class="text-gray-900 dark:text-white">{{ summary.Total }}</strong> 筆推薦，
            成功率 <strong class="text-green-600 dark:text-green-400">{{ summary.SuccessRate }}%</strong>
          </span>
        </div>
        </CollapsibleSection>

        <!-- 績效圖表（預設展開） -->
        <CollapsibleSection title="績效圖表">
        <!-- 累積損益曲線 -->
        <div class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-5 mb-6">
          <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-4 flex items-center gap-1">
            累積損益曲線
            <InfoTooltip text="假設每筆交易投入等額資金，把每筆損益依日期順序累加起來的走勢。線往上代表策略在賺、往下代表在賠。" />
          </h3>
          <EquityCurveChart :records="chartRecords" />
        </div>

        <!-- 月度期望值 + 模型校準 -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-5">
            <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-4 flex items-center gap-1">
              月度期望值
              <InfoTooltip text="每個月的每筆平均損益 %。綠色代表該月策略賺錢、紅色代表賠錢，用來看策略在多頭或空頭月份的表現差異。" />
            </h3>
            <MonthlyExpectancyChart :records="chartRecords" />
          </div>
          <div class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-5">
            <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-4 flex items-center gap-1">
              模型校準圖
              <InfoTooltip text="把推薦依 AI 模型預測的勝率分成三組，看每組實際的成功率。若模型準確，預測勝率越高的組別實際成功率也應該越高（由左往右遞增）。" />
            </h3>
            <CalibrationChart :records="chartRecords" />
          </div>
        </div>
        </CollapsibleSection>

        <!-- 推薦明細（預設展開） -->
        <CollapsibleSection title="推薦明細">
        <!-- Detail Table -->
        <div class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead class="bg-gray-50 dark:bg-gray-800/60">
                <tr>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">日期</th>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">股票代號</th>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">策略</th>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">推薦價</th>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">目標價</th>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">停損價</th>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">模型勝率</th>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">損益</th>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">狀態</th>
                </tr>
              </thead>
              <tbody class="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                <tr v-if="details.length === 0">
                  <td colspan="9" class="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    {{ summary.Total === 0 ? '該區間內沒有推薦紀錄' : '沒有明細資料' }}
                  </td>
                </tr>
                <tr v-else v-for="record in details" :key="recordKey(record)" class="hover:bg-blue-50/50 dark:hover:bg-gray-800/50 transition-colors">
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
                  <td :class="['px-6 py-4 whitespace-nowrap text-sm font-semibold', pnlColorClass(record.BacktestPnlPercent)]">
                    {{ formatPnl(record.BacktestPnlPercent) }}
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
        </CollapsibleSection>
      </template>
    </div>
  </div>
</template>
