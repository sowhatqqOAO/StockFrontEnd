<script setup lang="ts">
import { computed, ref } from 'vue'
import type { HistoryRecord } from '@/types'
import { BacktestStatus } from '@/types'

const props = defineProps<{
  records: HistoryRecord[]
}>()

const MIN_SAMPLES = 30
const W = 480
const H = 220
const PAD = { top: 20, right: 16, bottom: 40, left: 48 }

// 同時有模型機率與回測結果（成交且已回測）的樣本，依機率分三桶
const buckets = computed(() => {
  const defs = [
    { label: '<40%', test: (p: number) => p < 0.4 },
    { label: '40–60%', test: (p: number) => p >= 0.4 && p <= 0.6 },
    { label: '>60%', test: (p: number) => p > 0.6 }
  ]
  const samples = props.records.filter(r =>
    r.ModelProbability !== null && r.ModelProbability !== undefined &&
    r.BacktestPnlPercent !== null && r.BacktestPnlPercent !== undefined
  )
  return defs.map(d => {
    const group = samples.filter(r => d.test(r.ModelProbability!))
    const wins = group.filter(r => r.BacktestStatus === BacktestStatus.Success).length
    return {
      label: d.label,
      count: group.length,
      rate: group.length > 0 ? Math.round((wins / group.length) * 1000) / 10 : null
    }
  })
})

const totalSamples = computed(() => buckets.value.reduce((s, b) => s + b.count, 0))

const yAt = (rate: number) => PAD.top + (1 - rate / 100) * (H - PAD.top - PAD.bottom)
const xAt = (i: number) => {
  const span = W - PAD.left - PAD.right
  return PAD.left + (span / 3) * (i + 0.5)
}
const BAR_W = 56

const hoverIdx = ref<number | null>(null)
</script>

<template>
  <div>
    <!-- 樣本不足：新推薦才有推薦當下的機率，需累積數週 -->
    <div v-if="totalSamples < MIN_SAMPLES" class="py-12 text-center">
      <p class="text-sm text-gray-500 dark:text-gray-400">資料累積中</p>
      <p class="mt-1 text-xs text-gray-400 dark:text-gray-500">
        目前 {{ totalSamples }} 筆有效樣本（需 {{ MIN_SAMPLES }} 筆以上），2026-07-05 後的新推薦回測完成後才會納入
      </p>
    </div>
    <div v-else class="relative">
      <svg :viewBox="`0 0 ${W} ${H}`" class="w-full max-w-lg mx-auto" role="img" aria-label="模型校準圖">
        <!-- 格線 -->
        <g v-for="tick in [0, 25, 50, 75, 100]" :key="tick">
          <line :x1="PAD.left" :x2="W - PAD.right" :y1="yAt(tick)" :y2="yAt(tick)"
            class="stroke-gray-200 dark:stroke-gray-800" stroke-width="1" />
          <text :x="PAD.left - 8" :y="yAt(tick) + 4" text-anchor="end"
            class="fill-gray-400 dark:fill-gray-500 text-[11px]">{{ tick }}%</text>
        </g>
        <g v-for="(bucket, i) in buckets" :key="bucket.label"
          @mouseenter="hoverIdx = i" @mouseleave="hoverIdx = null" class="cursor-default">
          <rect v-if="bucket.rate !== null"
            :x="xAt(i) - BAR_W / 2" :y="yAt(bucket.rate)"
            :width="BAR_W" :height="Math.max(yAt(0) - yAt(bucket.rate), 2)"
            rx="4" fill="#3B82F6"
            :opacity="hoverIdx === null || hoverIdx === i ? 1 : 0.55" />
          <!-- 實際成功率 + 樣本數 -->
          <text v-if="bucket.rate !== null" :x="xAt(i)" :y="yAt(bucket.rate) - 6" text-anchor="middle"
            class="fill-gray-600 dark:fill-gray-300 text-[11px] font-medium">{{ bucket.rate }}%</text>
          <text v-else :x="xAt(i)" :y="yAt(0) - 6" text-anchor="middle"
            class="fill-gray-400 dark:fill-gray-500 text-[11px]">無樣本</text>
          <text :x="xAt(i)" :y="H - 22" text-anchor="middle"
            class="fill-gray-500 dark:fill-gray-400 text-[12px]">{{ bucket.label }}</text>
          <text :x="xAt(i)" :y="H - 8" text-anchor="middle"
            class="fill-gray-400 dark:fill-gray-500 text-[10px]">n={{ bucket.count }}</text>
        </g>
      </svg>
      <div v-if="hoverIdx !== null && buckets[hoverIdx]!.rate !== null"
        class="absolute pointer-events-none px-2.5 py-1.5 rounded-lg bg-gray-900/95 dark:bg-gray-700 text-white text-xs shadow-lg whitespace-nowrap -translate-x-1/2"
        :style="{ left: `${(xAt(hoverIdx) / W) * 100}%`, top: '0px' }">
        模型預測 {{ buckets[hoverIdx]!.label }}：實際成功率 {{ buckets[hoverIdx]!.rate }}%（{{ buckets[hoverIdx]!.count }} 筆）
      </div>
      <p class="mt-2 text-center text-xs text-gray-400 dark:text-gray-500">
        理想情況下，桶的實際成功率應由左至右遞增
      </p>
    </div>
  </div>
</template>
