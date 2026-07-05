<script setup lang="ts">
import { usePagination } from '@/composables/usePagination'

const props = defineProps<{
  currentPage: number
  totalPages: number
  pageSize: number
  totalCount: number
}>()

const emit = defineEmits<{
  change: [page: number]
}>()

const { pageItems } = usePagination(
  () => props.currentPage,
  () => props.totalPages
)

const prevPage = () => {
  if (props.currentPage > 1) emit('change', props.currentPage - 1)
}
const nextPage = () => {
  if (props.currentPage < props.totalPages) emit('change', props.currentPage + 1)
}
</script>

<template>
  <div v-if="totalPages > 1" class="bg-white dark:bg-gray-900 px-4 py-3 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between sm:px-6">
    <div class="flex-1 flex justify-between sm:hidden">
      <button @click="prevPage" :disabled="currentPage === 1"
        class="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed">
        前一頁
      </button>
      <span class="self-center text-sm text-gray-600 dark:text-gray-400">{{ currentPage }} / {{ totalPages }}</span>
      <button @click="nextPage" :disabled="currentPage === totalPages"
        class="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed">
        下一頁
      </button>
    </div>
    <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
      <div>
        <p class="text-sm text-gray-700 dark:text-gray-300">
          顯示第 <span class="font-medium">{{ (currentPage - 1) * pageSize + 1 }}</span>
          至 <span class="font-medium">{{ Math.min(currentPage * pageSize, totalCount) }}</span>
          筆，共 <span class="font-medium">{{ totalCount }}</span> 筆紀錄
        </p>
      </div>
      <div>
        <nav class="inline-flex items-center gap-1" aria-label="Pagination">
          <!-- 第一頁 -->
          <button @click="emit('change', 1)" :disabled="currentPage === 1" aria-label="第一頁" title="第一頁"
            class="inline-flex items-center justify-center h-9 w-9 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer">
            <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M15.707 15.707a1 1 0 01-1.414 0l-5-5a1 1 0 010-1.414l5-5a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 010 1.414zm-6 0a1 1 0 01-1.414 0l-5-5a1 1 0 010-1.414l5-5a1 1 0 011.414 1.414L5.414 10l4.293 4.293a1 1 0 010 1.414z" clip-rule="evenodd" />
            </svg>
          </button>
          <!-- 前一頁 -->
          <button @click="prevPage" :disabled="currentPage === 1" aria-label="前一頁" title="前一頁"
            class="inline-flex items-center justify-center h-9 w-9 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer">
            <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" />
            </svg>
          </button>

          <!-- 頁碼 -->
          <button v-for="page in pageItems" :key="page" @click="emit('change', page)"
            :aria-current="page === currentPage ? 'page' : undefined"
            :class="[
              page === currentPage
                ? 'bg-blue-600 text-white font-semibold shadow-sm'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800',
              'inline-flex items-center justify-center h-9 min-w-9 px-2 rounded-lg text-sm transition-colors cursor-pointer'
            ]"
          >
            {{ page }}
          </button>

          <!-- 下一頁 -->
          <button @click="nextPage" :disabled="currentPage === totalPages" aria-label="下一頁" title="下一頁"
            class="inline-flex items-center justify-center h-9 w-9 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer">
            <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
            </svg>
          </button>
          <!-- 最後一頁 -->
          <button @click="emit('change', totalPages)" :disabled="currentPage === totalPages" aria-label="最後一頁" title="最後一頁"
            class="inline-flex items-center justify-center h-9 w-9 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer">
            <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M4.293 15.707a1 1 0 010-1.414L8.586 10 4.293 5.707a1 1 0 011.414-1.414l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0zm6 0a1 1 0 010-1.414L14.586 10l-4.293-4.293a1 1 0 011.414-1.414l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0z" clip-rule="evenodd" />
            </svg>
          </button>
        </nav>
      </div>
    </div>
  </div>
</template>
