<script setup lang="ts">
import { computed, ref } from 'vue'
import type { HistoryRecord } from '@/types'
import { formatDate } from '@/utils/date'

const props = defineProps<{
  records: HistoryRecord[]
}>()

const W = 720
const H = 240
const PAD = { top: 16, right: 16, bottom: 28, left: 48 }

// 有損益的記錄按日期升冪，累加損益（假設每筆等額投入）
const points = computed(() => {
  const filled = props.records
    .filter(r => r.BacktestPnlPercent !== null && r.BacktestPnlPercent !== undefined)
    .sort((a, b) => a.RecommendationDate.localeCompare(b.RecommendationDate))

  let cum = 0
  return filled.map(r => {
    cum += r.BacktestPnlPercent!
    return { date: r.RecommendationDate, pnl: r.BacktestPnlPercent!, cum: Math.round(cum * 100) / 100 }
  })
})

const yDomain = computed(() => {
  if (points.value.length === 0) return { min: -1, max: 1 }
  const values = points.value.map(p => p.cum)
  const min = Math.min(0, ...values)
  const max = Math.max(0, ...values)
  const padding = Math.max((max - min) * 0.1, 1)
  return { min: min - padding, max: max + padding }
})

const xAt = (i: number) => {
  const n = points.value.length
  if (n <= 1) return PAD.left
  return PAD.left + (i / (n - 1)) * (W - PAD.left - PAD.right)
}
const yAt = (v: number) => {
  const { min, max } = yDomain.value
  return PAD.top + (1 - (v - min) / (max - min)) * (H - PAD.top - PAD.bottom)
}

const linePath = computed(() =>
  points.value.map((p, i) => `${i === 0 ? 'M' : 'L'}${xAt(i).toFixed(1)},${yAt(p.cum).toFixed(1)}`).join(' ')
)

const yTicks = computed(() => {
  const { min, max } = yDomain.value
  const step = (max - min) / 4
  return Array.from({ length: 5 }, (_, i) => Math.round((min + step * i) * 10) / 10)
})

// Hover crosshair + tooltip
const hoverIdx = ref<number | null>(null)
const onMove = (e: MouseEvent) => {
  const svg = e.currentTarget as SVGSVGElement
  const rect = svg.getBoundingClientRect()
  const x = ((e.clientX - rect.left) / rect.width) * W
  const n = points.value.length
  if (n === 0) return
  const t = (x - PAD.left) / (W - PAD.left - PAD.right)
  hoverIdx.value = Math.max(0, Math.min(n - 1, Math.round(t * (n - 1))))
}
const hovered = computed(() => (hoverIdx.value !== null ? points.value[hoverIdx.value] : null))
</script>

<template>
  <div>
    <div v-if="points.length === 0" class="py-12 text-center text-sm text-gray-500 dark:text-gray-400">
      區間內尚無已回測的成交記錄
    </div>
    <div v-else class="relative">
      <svg :viewBox="`0 0 ${W} ${H}`" class="w-full" role="img" aria-label="累積損益曲線"
        @mousemove="onMove" @mouseleave="hoverIdx = null">
        <!-- 水平格線與 Y 軸刻度 -->
        <g v-for="tick in yTicks" :key="tick">
          <line :x1="PAD.left" :x2="W - PAD.right" :y1="yAt(tick)" :y2="yAt(tick)"
            class="stroke-gray-200 dark:stroke-gray-800" stroke-width="1" />
          <text :x="PAD.left - 8" :y="yAt(tick) + 4" text-anchor="end"
            class="fill-gray-400 dark:fill-gray-500 text-[11px]">{{ tick }}%</text>
        </g>
        <!-- 0 軸參考線 -->
        <line :x1="PAD.left" :x2="W - PAD.right" :y1="yAt(0)" :y2="yAt(0)"
          class="stroke-gray-400 dark:stroke-gray-500" stroke-width="1.5" stroke-dasharray="4 3" />
        <!-- 曲線 -->
        <path :d="linePath" fill="none" stroke="#3B82F6" stroke-width="2" stroke-linejoin="round" />
        <!-- 起迄日期 -->
        <text :x="PAD.left" :y="H - 8" class="fill-gray-400 dark:fill-gray-500 text-[11px]">{{ formatDate(points[0]!.date) }}</text>
        <text :x="W - PAD.right" :y="H - 8" text-anchor="end" class="fill-gray-400 dark:fill-gray-500 text-[11px]">{{ formatDate(points[points.length - 1]!.date) }}</text>
        <!-- Hover crosshair -->
        <g v-if="hovered && hoverIdx !== null">
          <line :x1="xAt(hoverIdx)" :x2="xAt(hoverIdx)" :y1="PAD.top" :y2="H - PAD.bottom"
            class="stroke-gray-300 dark:stroke-gray-600" stroke-width="1" />
          <circle :cx="xAt(hoverIdx)" :cy="yAt(hovered.cum)" r="4" fill="#3B82F6"
            class="stroke-white dark:stroke-gray-900" stroke-width="2" />
        </g>
      </svg>
      <!-- Tooltip -->
      <div v-if="hovered && hoverIdx !== null"
        class="absolute pointer-events-none px-2.5 py-1.5 rounded-lg bg-gray-900/95 dark:bg-gray-700 text-white text-xs shadow-lg whitespace-nowrap -translate-x-1/2"
        :style="{ left: `${(xAt(hoverIdx) / W) * 100}%`, top: '0px' }">
        {{ formatDate(hovered.date) }}：累積 {{ hovered.cum > 0 ? '+' : '' }}{{ hovered.cum }}%
        <span class="text-gray-300">（單筆 {{ hovered.pnl > 0 ? '+' : '' }}{{ hovered.pnl }}%）</span>
      </div>
    </div>
  </div>
</template>
