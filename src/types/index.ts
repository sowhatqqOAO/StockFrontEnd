// 用戶資訊
export interface User {
  id: string
  username: string
  email?: string
}

// 市場類型
export type MarketType = 'TW' | 'US'

// 登入請求
export interface LoginRequest {
  username: string
  password: string
}

// Google 登入請求
export interface GoogleLoginRequest {
  credential: string
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

// 歷史推薦紀錄 (C# Azure Function 的真實回傳結構)
export interface HistoryRecord {
  StockCode: string
  BuyPoint: number
  SellPoint: number
  SuggestedExitPoint: number
  RecommendationDate: string
  StrategyType: string
  Ma5: number
  Ma20: number
  BacktestStatus?: BacktestStatus
  Market?: MarketType
}

// 回測狀態 (對齊 C# BacktestStatusEnum)
export const BacktestStatus = {
  Pending: 0,
  Success: 1,
  Failed: 2,
  StopLoss: 3
} as const
export type BacktestStatus = typeof BacktestStatus[keyof typeof BacktestStatus]

// 統計摘要
export interface StatisticsSummary {
  Total: number
  Success: number
  Failed: number
  StopLoss: number
  Pending: number
  SuccessRate: number
}

// 統計 API 回應
export interface StatisticsResponse {
  Summary: StatisticsSummary
  Details: HistoryRecord[]
  Pagination: PaginationMeta
}

// 分頁包裝資料 (C# Pagination 結構)
export interface PaginationMeta {
  CurrentPage: number
  PageSize: number
  TotalCount: number
  TotalPages: number
}

// API 分頁回應包裝 (C# 真實回傳結構)
export interface PaginatedResponse<T> {
  Data: T[]
  Pagination: PaginationMeta
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  message?: string
}
