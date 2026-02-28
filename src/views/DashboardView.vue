<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { mockGetStockAnalysisList } from '@/mock/stockData'
import type { StockAnalysis } from '@/types'
import WatchlistTable from '@/components/WatchlistTable.vue'

const router = useRouter()
const authStore = useAuthStore()

const stocks = ref<StockAnalysis[]>([])
const loading = ref(true)

async function loadStocks() {
  loading.value = true
  try {
    stocks.value = await mockGetStockAnalysisList()
  } finally {
    loading.value = false
  }
}

function handleLogout() {
  authStore.logout()
  router.push('/login')
}

onMounted(() => {
  loadStocks()
})
</script>

<template>
  <div class="min-h-screen bg-gray-100">
    <!-- Header -->
    <header class="bg-white shadow">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div class="flex justify-between items-center">
          <h1 class="text-2xl font-bold text-gray-900">股票觀察系統</h1>
          <div class="flex items-center gap-4">
            <span class="text-gray-600">
              歡迎，{{ authStore.user?.username }}
            </span>
            <button
              @click="handleLogout"
              class="px-4 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
            >
              登出
            </button>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div class="bg-white rounded-lg shadow p-6">
          <div class="text-sm text-gray-500">觀察名單</div>
          <div class="text-3xl font-bold text-gray-900">{{ stocks.length }}</div>
          <div class="text-sm text-gray-500 mt-1">檔股票</div>
        </div>
        <div class="bg-white rounded-lg shadow p-6">
          <div class="text-sm text-gray-500">高信心標的</div>
          <div class="text-3xl font-bold text-green-600">
            {{ stocks.filter(s => s.confidenceIndex >= 80).length }}
          </div>
          <div class="text-sm text-gray-500 mt-1">信心指數 ≥ 80%</div>
        </div>
        <div class="bg-white rounded-lg shadow p-6">
          <div class="text-sm text-gray-500">今日分析</div>
          <div class="text-3xl font-bold text-blue-600">
            {{ stocks.filter(s => s.analysisDate === '2026-02-06').length }}
          </div>
          <div class="text-sm text-gray-500 mt-1">最新更新</div>
        </div>
      </div>

      <!-- Watchlist Table -->
      <div class="bg-white rounded-lg shadow">
        <div class="px-6 py-4 border-b border-gray-200">
          <div class="flex justify-between items-center">
            <h2 class="text-lg font-semibold text-gray-900">AI 分析建議</h2>
            <!-- Content Options -->
            <div class="flex space-x-1 sm:space-x-4 ml-8">
              <button
                v-for="view in ['dashboard', 'history']"
                :key="view"
                @click="view === 'history' ? router.push('/history') : null"
                class="px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer"
                :class="view === 'history'
                  ? 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                  : 'bg-blue-50 text-blue-700'"
              >
                {{ view === 'history' ? '歷史紀錄' : '今日推薦' }}
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
        <WatchlistTable :stocks="stocks" :loading="loading" />
      </div>

      <!-- Disclaimer -->
      <div class="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p class="text-sm text-yellow-800">
          <strong>警語：</strong>本分析僅供參考，不代表投資建議。股市投資有風險，進場前請務必衡量自身風險承受度。
        </p>
      </div>
    </main>
  </div>
</template>
