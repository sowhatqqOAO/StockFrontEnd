import type { PaginatedResponse, HistoryRecord } from '@/types'
import { apiFetch } from './apiClient'

export async function fetchHistoryRecords(market: string, pageIndex: number, pageSize: number, stockCode: string = ''): Promise<PaginatedResponse<HistoryRecord>> {
    return apiFetch<PaginatedResponse<HistoryRecord>>('/api/history', {
        market,
        page: pageIndex,
        pageSize,
        symbol: stockCode
    })
}
