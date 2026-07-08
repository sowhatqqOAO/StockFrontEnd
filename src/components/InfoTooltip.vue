<script setup lang="ts">
import { ref, nextTick } from 'vue'

defineProps<{
  text: string
}>()

const open = ref(false)
const btnRef = ref<HTMLButtonElement | null>(null)
// 氣泡的 fixed 座標（相對視窗）
const pos = ref({ top: 0, left: 0 })
const WIDTH = 224 // w-56
const MARGIN = 8  // 距視窗邊緣的最小間距

const show = async () => {
  open.value = true
  await nextTick()
  const el = btnRef.value
  if (!el) return
  const r = el.getBoundingClientRect()
  // 水平置中對齊 icon，並夾在視窗內
  let left = r.left + r.width / 2 - WIDTH / 2
  left = Math.max(MARGIN, Math.min(left, window.innerWidth - WIDTH - MARGIN))
  pos.value = { top: r.top, left }
}
const hide = () => { open.value = false }
</script>

<template>
  <span class="inline-flex items-center align-middle"
    @mouseenter="show" @mouseleave="hide">
    <button ref="btnRef" type="button"
      :aria-label="text"
      @click.stop="open ? hide() : show()"
      @blur="hide"
      class="inline-flex items-center justify-center w-4 h-4 rounded-full text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 cursor-help transition-colors">
      <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
      </svg>
    </button>
    <!-- 懸浮氣泡：Teleport 到 body + fixed，避免被 overflow 容器裁切 -->
    <Teleport to="body">
      <span v-if="open" role="tooltip"
        class="fixed z-[100] w-56 px-3 py-2 rounded-lg bg-gray-900 dark:bg-gray-700 text-white text-xs font-normal leading-relaxed shadow-lg text-left -translate-y-full pointer-events-none"
        :style="{ top: `${pos.top - 8}px`, left: `${pos.left}px` }">
        {{ text }}
      </span>
    </Teleport>
  </span>
</template>
