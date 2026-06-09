# Quantum Oracle

Quantum Oracle 是一個以 Next.js 建構的易經占問互動應用，目標是把六爻起卦流程、卦象轉化與可驗證解讀做成可維護、可擴充、可測試的開源專案。

本 README 採開源社群導向，聚焦在技術結構與貢獻方式，歡迎提交 Issue、PR 與提案。

## 功能概覽

- 六爻生成與動爻判定
- 本卦 / 之卦推導與視覺化顯示
- 月建、日辰資訊整合
- 後端解讀流程（含 LLM 與 fallback）
- 可追溯事實 facts 輸出
- 單元測試涵蓋核心推導與解讀邏輯

## 技術棧

- Next.js 16
- React 19
- TypeScript
- Framer Motion
- lunar-javascript
- Vitest
- ESLint

## 專案結構

	app/
	  api/divination/route.ts      # 占問 API
	  page.tsx                     # 首頁入口
	components/
	  OracleApp.tsx                # 主流程容器
	  HexagramDisplay.tsx          # 卦象顯示
	  DivinationButton.tsx         # 起卦按鈕
	  YaoLine.tsx                  # 爻線元件
	  ResultTyping.tsx             # 文字打字效果
	lib/
	  divination.ts                # 起卦與時間資訊
	  hexagrams.ts                 # 卦象推導
	  interpretation.ts            # 驗證與解讀策略
	  types.ts                     # 型別定義
	  scripture.json               # 經文資料
	  *.test.ts                    # 單元測試

## 本機開發

### 1. 安裝

	npm install

### 2. 設定環境變數

建立 .env.local，至少包含：

	MINIMAX_API_KEY=your_minimax_api_key

可選：

	MINIMAX_MODEL=MiniMax-M1

### 3. 啟動

	npm run dev

預設網址：http://localhost:3000

## 可用指令

	npm run dev
	npm run build
	npm run start
	npm run lint
	npm run test

## API 摘要

端點：POST /api/divination

請求 body

- question: 使用者提問
- result: 前端產生的占卜結果（六爻、本卦、之卦、動爻等）

回應欄位

- analysis: 最終解讀文字
- facts: 可追溯事實陣列
- mode: verified-llm 或 verified-fallback

## 測試與品質門檻

提交 PR 前請至少完成：

	npm run lint
	npm run test
	npm run build

若變更演算法（如起卦、動爻判定、卦象映射），請同步新增或調整 lib 下對應測試。

## 貢獻指南

### 流程

1. Fork 專案
2. 建立功能分支
3. 提交具描述性的 commit
4. 發送 Pull Request

### 分支命名建議

- feat/功能名稱
- fix/問題名稱
- docs/文件名稱
- test/測試名稱
- refactor/模組名稱

### Commit 訊息建議

- feat: 新增功能
- fix: 修正問題
- docs: 文件調整
- test: 測試補強
- refactor: 重構
- chore: 維護事項

範例：

	feat: add verified fallback strategy for missing llm response
	fix: prevent invalid moving line index in interpretation parser

### PR 檢查清單

- 變更範圍清楚且單一
- 本機 lint、test、build 通過
- 有必要的測試與文件更新
- 不包含無關格式化或大規模噪音修改
- 說明是否為 breaking change

## Issue 回報建議

請盡量附上：

- 重現步驟
- 預期行為與實際行為
- 錯誤訊息或截圖
- 執行環境（Node 版本、作業系統）

## 安全與設定

- 請勿提交任何真實 API Key
- 建議使用 .env.local 管理本機私密設定
- 若發現潛在安全問題，請先私下聯繫維護者，不要直接公開 exploit 細節

## Roadmap

- 更完整的解讀策略測試覆蓋
- 多語系支援
- 使用者歷史紀錄與回顧頁
- 貢獻者文件與範本（Issue Template / PR Template）

## License

MIT
