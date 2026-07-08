<script setup lang="ts">
import { ref } from 'vue'

defineProps<{
  text: string
}>()

const open = ref(false)
</script>

<template>
  <span class="relative inline-flex items-center align-middle"
    @mouseenter="open = true" @mouseleave="open = false">
    <button type="button"
      :aria-label="text"
      @click.stop="open = !open"
      @blur="open = false"
      class="inline-flex items-center justify-center w-4 h-4 rounded-full text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 cursor-help transition-colors">
      <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
      </svg>
    </button>
    <!-- 懸浮氣泡 -->
    <span v-if="open" role="tooltip"
      class="absolute left-1/2 bottom-full mb-2 -translate-x-1/2 z-50 w-56 px-3 py-2 rounded-lg bg-gray-900 dark:bg-gray-700 text-white text-xs font-normal leading-relaxed shadow-lg normal-case tracking-normal text-left">
      {{ text }}
      <!-- 箭頭 -->
      <span class="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-gray-900 dark:border-t-gray-700"></span>
    </span>
  </span>
</template>
