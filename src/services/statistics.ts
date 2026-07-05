import type { StatisticsResponse } from '@/types'
import { apiFetch } from './apiClient'

export async function fetchStatistics(
    market: string,
    startDate: string,
    endDate: string,
    page: number = 1,
    pageSize: number = 20,
    symbol: string = ''
): Promise<StatisticsResponse> {
    return apiFetch<StatisticsResponse>('/api/statistics', {
        market,
        startDate,
        endDate,
        page,
        pageSize,
        symbol
    })
}
