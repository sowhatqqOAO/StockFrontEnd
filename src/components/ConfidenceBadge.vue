<script setup lang="ts">
defineProps<{
  confidence: number
}>()

function getConfidenceColor(confidence: number): string {
  if (confidence >= 80) return 'bg-green-100 text-green-800'
  if (confidence >= 60) return 'bg-yellow-100 text-yellow-800'
  return 'bg-red-100 text-red-800'
}

function getConfidenceLabel(confidence: number): string {
  if (confidence >= 80) return '高'
  if (confidence >= 60) return '中'
  return '低'
}
</script>

<template>
  <span
    :class="[
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
      getConfidenceColor(confidence)
    ]"
  >
    {{ confidence }}% ({{ getConfidenceLabel(confidence) }})
  </span>
</template>
