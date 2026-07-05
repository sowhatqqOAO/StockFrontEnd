import { computed, toValue, type MaybeRefOrGetter } from 'vue'

// 當前頁置中的固定 5 頁視窗（貼近頭尾時靠邊），總頁數不足 5 就全列
export function usePagination(currentPage: MaybeRefOrGetter<number>, totalPages: MaybeRefOrGetter<number>) {
    const pageItems = computed<number[]>(() => {
        const total = toValue(totalPages)
        const cur = toValue(currentPage)
        if (total <= 0) return []

        let winStart = Math.max(1, cur - 2)
        const winEnd = Math.min(total, winStart + 4)
        winStart = Math.max(1, winEnd - 4)
        return Array.from({ length: winEnd - winStart + 1 }, (_, i) => winStart + i)
    })

    return { pageItems }
}
