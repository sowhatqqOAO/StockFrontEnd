import { computed, toValue, type MaybeRefOrGetter } from 'vue'

// 固定 5 頁視窗的分頁邏輯
export function usePagination(currentPage: MaybeRefOrGetter<number>, totalPages: MaybeRefOrGetter<number>) {
    const visiblePages = computed<number[]>(() => {
        const total = toValue(totalPages)
        const cur = toValue(currentPage)
        const winStart = Math.max(1, Math.min(cur, total - 4))
        const winEnd = Math.min(total, winStart + 4)
        return Array.from({ length: winEnd - winStart + 1 }, (_, i) => winStart + i)
    })

    const showFirstBtn = computed(() => visiblePages.value.length > 0 && visiblePages.value[0]! > 1)
    const showLastBtn = computed(() =>
        visiblePages.value.length > 0 && visiblePages.value[visiblePages.value.length - 1]! < toValue(totalPages)
    )

    return { visiblePages, showFirstBtn, showLastBtn }
}
