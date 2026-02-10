// 用戶資訊
export interface User {
  id: string
  username: string
  email?: string
}

// 登入請求
export interface LoginRequest {
  username: string
  password: string
}

// 登入回應
export interface LoginResponse {
  token: string
  user: User
}

// 觀察名單 + AI 分析
export interface StockAnalysis {
  symbol: string              // "3006.TW"
  closePrice: number          // 160
  yahooUrl: string            // Yahoo Finance 連結
  category: string            // "連三天回測至5-20日線之內"
  suggestedBuyPrice: number   // 158.5
  suggestedSellPrice: number  // 172.0
  stopLossPrice: number       // 152.0
  comment: string             // 短評
  confidenceIndex: number     // 75 (百分比)
  analysisDate: string        // "2026-02-06"
  detailedAnalysis?: {
    entryLogic: string        // 進場邏輯
    targetReason: string      // 目標設定說明
    riskManagement: string    // 風險控管
  }
}

// API 回應包裝
export interface ApiResponse<T> {
  success: boolean
  data?: T
  message?: string
}
