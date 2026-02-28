import type { PaginatedResponse, HistoryRecord } from '@/types'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

export async function fetchHistoryRecords(pageIndex: number, pageSize: number): Promise<PaginatedResponse<HistoryRecord>> {
    try {
        const token = localStorage.getItem('auth_token') || ''

        const response = await fetch(`${API_BASE_URL}/api/history?page=${pageIndex}&pageSize=${pageSize}`, {
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
