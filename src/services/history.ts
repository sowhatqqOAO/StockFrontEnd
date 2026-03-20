import type { PaginatedResponse, HistoryRecord } from '@/types'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

export async function fetchHistoryRecords(market: string, pageIndex: number, pageSize: number, stockCode: string = ''): Promise<PaginatedResponse<HistoryRecord>> {
    try {
        const token = localStorage.getItem('auth_token') || ''

        let url = `${API_BASE_URL}/api/history?market=${market}&page=${pageIndex}&pageSize=${pageSize}`
        if (stockCode) {
            url += `&symbol=${encodeURIComponent(stockCode)}`
        }

        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })

        if (!response.ok) {
            throw new Error('API 請求失敗')
        }

        return await response.json() as PaginatedResponse<HistoryRecord>
    } catch (error) {
        console.error('Failed to fetch history:', error)
        // 回傳空陣列與預設分頁，避免前端掛掉
        return {
            Data: [],
            Pagination: {
                CurrentPage: pageIndex,
                PageSize: pageSize,
                TotalCount: 0,
                TotalPages: 0
            }
        }
    }
}
