import type { StatisticsResponse } from '@/types'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

export async function fetchStatistics(
    market: string,
    startDate: string,
    endDate: string,
    page: number = 1,
    pageSize: number = 20,
    symbol: string = ''
): Promise<StatisticsResponse> {
    try {
        const token = localStorage.getItem('auth_token') || ''

        let url = `${API_BASE_URL}/api/statistics?market=${market}&startDate=${startDate}&endDate=${endDate}&page=${page}&pageSize=${pageSize}`
        if (symbol) {
            url += `&symbol=${encodeURIComponent(symbol)}`
        }

        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })

        if (!response.ok) {
            throw new Error('API 請求失敗')
        }

        return await response.json() as StatisticsResponse
    } catch (error) {
        console.error('Failed to fetch statistics:', error)
        // 回傳空資料避免前端崩潰
        return {
            Summary: {
                Total: 0,
                Success: 0,
                Failed: 0,
                StopLoss: 0,
                Pending: 0,
                SuccessRate: 0
            },
            Details: [],
            Pagination: {
                CurrentPage: page,
                PageSize: pageSize,
                TotalCount: 0,
                TotalPages: 0
            }
        }
    }
}
