<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'
import { useDarkMode } from '@/composables/useDarkMode'
import { useMarketStore } from '@/stores/market'

const authStore = useAuthStore()
const router = useRouter()
const { isDark, toggle: toggleDark } = useDarkMode()
const marketStore = useMarketStore()

const handleLogout = () => {
  authStore.logout()
  router.push('/login')
}

const navTabs = [
  { label: '今日推薦', to: '/' },
  { label: '歷史紀錄', to: '/history' },
  { label: '回測統計', to: '/statistics' }
]
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col pt-0 transition-colors">
    <!-- 全域 Header -->
    <header class="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm z-10">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div class="flex justify-between items-center flex-wrap gap-4">
          <!-- Logo & Title -->
          <router-link to="/" class="text-2xl font-bold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition cursor-pointer">
            股票觀察系統
          </router-link>

          <!-- Market Toggle -->
          <div class="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg" role="group" aria-label="切換市場">
            <button
              @click="marketStore.setMarket('TW')"
              :aria-pressed="marketStore.currentMarket === 'TW'"
              :class="['px-4 py-1.5 text-sm font-medium rounded-md transition-colors cursor-pointer',
                       marketStore.currentMarket === 'TW'
                         ? 'bg-white dark:bg-gray-700 text-blue-700 dark:text-blue-400 shadow-sm'
                         : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200']"
            >
              台股 TW
            </button>
            <button
              @click="marketStore.setMarket('US')"
              :aria-pressed="marketStore.currentMarket === 'US'"
              :class="['px-4 py-1.5 text-sm font-medium rounded-md transition-colors cursor-pointer',
                       marketStore.currentMarket === 'US'
                         ? 'bg-white dark:bg-gray-700 text-blue-700 dark:text-blue-400 shadow-sm'
                         : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200']"
            >
              美股 US
            </button>
          </div>

          <!-- User Actions -->
          <div class="flex items-center gap-4">
            <!-- Dark Mode Toggle -->
            <button @click="toggleDark" class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition text-gray-600 dark:text-gray-300" title="切換深色模式">
              <svg v-if="isDark" class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clip-rule="evenodd"/></svg>
              <svg v-else class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"/></svg>
            </button>
            <span class="text-gray-600 dark:text-gray-300 text-sm hidden sm:inline-block">
              歡迎，{{ authStore.user?.username ?? '訪客' }}
            </span>
            <button
              @click="handleLogout"
              class="px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
            >
              登出
            </button>
          </div>
        </div>
      </div>

      <!-- 全域導航頁籤 -->
      <nav class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" aria-label="主導航">
        <div class="flex gap-1 -mb-px">
          <router-link
            v-for="tab in navTabs"
            :key="tab.to"
            :to="tab.to"
            class="px-4 py-3 text-sm font-medium border-b-2 transition-colors"
            :class="$route.path === tab.to
              ? 'border-blue-600 text-blue-700 dark:border-blue-400 dark:text-blue-400'
              : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'"
          >
            {{ tab.label }}
          </router-link>
        </div>
      </nav>
    </header>

    <!-- Page Content -->
    <main class="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <router-view />
    </main>
  </div>
</template>
