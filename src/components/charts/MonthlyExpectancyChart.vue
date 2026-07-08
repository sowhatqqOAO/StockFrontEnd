<script setup lang="ts">
import { computed, ref } from 'vue'
import type { HistoryRecord } from '@/types'

const props = defineProps<{
  records: HistoryRecord[]
}>()

const W = 720
const H = 220
const PAD = { top: 20, right: 16, bottom: 28, left: 48 }

// 依月份分組，期望值 = 該月成交樣本的平均損益 %
const bars = computed(() => {
  const byMonth = new Map<string, number[]>()
  for (const r of props.records) {
    if (r.BacktestPnlPercent === null || r.BacktestPnlPercent === undefined) continue
    const month = r.RecommendationDate.slice(0, 7)
    if (!byMonth.has(month)) byMonth.set(month, [])
    byMonth.get(month)!.push(r.BacktestPnlPercent)
  }
  return [...byMonth.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([month, pnls]) => ({
      month,
      expectancy: Math.round((pnls.reduce((s, v) => s + v, 0) / pnls.length) * 100) / 100,
      count: pnls.length
    }))
})

const yDomain = computed(() => {
  if (bars.value.length === 0) return { min: -1, max: 1 }
  const values = bars.value.map(b => b.expectancy)
  const min = Math.min(0, ...values)
  const max = Math.max(0, ...values)
  const pad = Math.max((max - min) * 0.15, 0.5)
  return { min: min - pad, max: max + pad }
})

const yAt = (v: number) => {
  const { min, max } = yDomain.value
  return PAD.top + (1 - (v - min) / (max - min)) * (H - PAD.top - PAD.bottom)
}
const barWidth = computed(() => {
  const n = bars.value.length
  const span = W - PAD.left - PAD.right
  return Math.min(48, (span / Math.max(n, 1)) * 0.6)
})
const xAt = (i: number) => {
  const n = bars.value.length
  const span = W - PAD.left - PAD.right
  return PAD.left + (span / n) * (i + 0.5)
}

const hoverIdx = ref<number | null>(null)
</script>

<template>
  <div>
    <div v-if="bars.length === 0" class="py-12 text-center text-sm text-gray-500 dark:text-gray-400">
      區間內尚無已回測的成交記錄
    </div>
    <div v-else class="relative">
      <svg :viewBox="`0 0 ${W} ${H}`" class="w-full" role="img" aria-label="月度期望值長條圖">
        <!-- 0 軸 -->
        <line :x1="PAD.left" :x2="W - PAD.right" :y1="yAt(0)" :y2="yAt(0)"
          class="stroke-gray-400 dark:stroke-gray-500" stroke-width="1.5" />
        <g v-for="(bar, i) in bars" :key="bar.month"
          @mouseenter="hoverIdx = i" @mouseleave="hoverIdx = null" class="cursor-default">
          <!-- 正綠負紅，端點圓角、貼齊 0 軸 -->
          <rect
            :x="xAt(i) - barWidth / 2"
            :y="bar.expectancy >= 0 ? yAt(bar.expectancy) : yAt(0)"
            :width="barWidth"
            :height="Math.max(Math.abs(yAt(bar.expectancy) - yAt(0)), 2)"
            rx="4"
            :fill="bar.expectancy >= 0 ? '#16A34A' : '#EF4444'"
            :opacity="hoverIdx === null || hoverIdx === i ? 1 : 0.55"
          />
          <!-- 直接數值標籤 -->
          <text :x="xAt(i)" :y="bar.expectancy >= 0 ? yAt(bar.expectancy) - 6 : yAt(bar.expectancy) + 14"
            text-anchor="middle" class="fill-gray-600 dark:fill-gray-300 text-[11px] font-medium">
            {{ bar.expectancy > 0 ? '+' : '' }}{{ bar.expectancy }}%
          </text>
          <!-- 月份 -->
          <text :x="xAt(i)" :y="H - 8" text-anchor="middle" class="fill-gray-400 dark:fill-gray-500 text-[11px]">
            {{ bar.month.slice(2) }}
          </text>
        </g>
      </svg>
      <div v-if="hoverIdx !== null"
        class="absolute pointer-events-none px-2.5 py-1.5 rounded-lg bg-gray-900/95 dark:bg-gray-700 text-white text-xs shadow-lg whitespace-nowrap -translate-x-1/2"
        :style="{ left: `${(xAt(hoverIdx) / W) * 100}%`, top: '0px' }">
        {{ bars[hoverIdx]!.month }}：期望值 {{ bars[hoverIdx]!.expectancy > 0 ? '+' : '' }}{{ bars[hoverIdx]!.expectancy }}%
        <span class="text-gray-300">（{{ bars[hoverIdx]!.count }} 筆成交）</span>
      </div>
    </div>
  </div>
</template>
