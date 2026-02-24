# TripFun — 系統架構速查

> 給 Claude 用的上下文文件。開始任何新工作前先讀這份。

---

## 專案概覽

- **名稱**: TripFun（前名 TripFund）
- **類型**: Next.js 16 PWA，旅遊公基金管理
- **部署**: https://tripfun.vercel.app
- **後端**: Supabase（Postgres + Auth + Realtime）
- **Email**: Resend API（`onboarding@resend.dev`）

---

## 技術棧

| 層 | 技術 |
|----|------|
| Frontend | Next.js 16 (App Router), TypeScript, Tailwind CSS |
| Backend | Supabase (Postgres, Row Level Security) |
| Auth | Supabase Auth (email/password) |
| State | React useState + `router.refresh()` for server sync |
| Email | Resend (`re_Q3ZcBqfH_JFb23vgCH5ZXZZbXTy9mAoUM`) |
| Deploy | Vercel (auto-deploy on push to main) |

---

## 目錄結構

```
src/
├── app/
│   ├── (app)/                  # 需要登入的頁面
│   │   ├── dashboard/          # 首頁（旅程列表）
│   │   ├── profile/            # 個人設定
│   │   └── trips/
│   │       ├── [id]/           # 旅程詳情
│   │       │   ├── page.tsx            # Server Component (data fetch)
│   │       │   ├── _components/
│   │       │   │   ├── TripDetailClient.tsx    # 主 Client 容器
│   │       │   │   ├── FundBalanceCard.tsx     # 公基金卡片
│   │       │   │   ├── ExpenseListClient.tsx   # 首頁支出預覽（最近5筆）
│   │       │   │   ├── AddExpenseButton.tsx    # 新增支出 Modal
│   │       │   │   ├── AddFundButton.tsx       # 追加基金 Modal
│   │       │   │   └── TripActionMenu.tsx      # ⚙設定 按鈕 + Modal
│   │       │   ├── expenses/   # 支出記錄（完整列表）
│   │       │   ├── members/    # 成員管理
│   │       │   └── settlement/ # 結算頁
│   │       └── new/            # 新增旅程
│   ├── (auth)/                 # 登入/註冊
│   └── api/
│       ├── exchange-rate/      # 匯率查詢
│       ├── process-invite/     # 處理邀請連結
│       └── send-report/        # 寄送結算 Email
├── components/
│   ├── charts/CategoryPieChart.tsx
│   ├── layout/Navbar.tsx, BottomNav.tsx
│   └── ui/                    # Modal(Portal), Button, Input, etc.
├── lib/
│   ├── settlement.ts           # 核心結算邏輯
│   ├── constants.ts            # 幣別、國家對應、支出類別
│   └── utils.ts                # formatCurrency, formatDate, etc.
└── types/index.ts              # 所有 TypeScript 型別
```

---

## 資料庫 Schema（重要欄位）

### `trips`
| 欄位 | 型別 | 說明 |
|------|------|------|
| id | uuid | PK |
| title | text | 旅程名稱 |
| creator_id | uuid | FK → auth.users |
| trip_currency | text | 記帳幣別 (e.g. KRW) |
| settlement_currency | text | 結帳幣別 (e.g. TWD) |
| exchange_rate | float | 匯率 |
| initial_fund | numeric | **初始基金（建立時固定）** |
| current_fund | numeric | **即時餘額（每次支出/追加即更新）** |
| start_date | date | 旅程開始日 |
| end_date | date | 旅程結束日 |
| status | text | active / ended |

⚠️ `initial_fund` 建立後不再更新。計算「已用」要從 `expenses` 加總，不要用 `initial_fund - current_fund`。

### `trip_members`
| 欄位 | 型別 | 說明 |
|------|------|------|
| id | uuid | PK |
| trip_id | uuid | FK → trips |
| nickname | text | 顯示名稱 |
| role | text | creator / collaborator / member |
| per_person_contribution | numeric | 舊欄位，現在用 fund_contributions |

### `expenses`
| 欄位 | 型別 | 說明 |
|------|------|------|
| id | uuid | PK |
| trip_id | uuid | FK → trips |
| amount | numeric | 金額（記帳幣別） |
| category | text | meals / transport / shopping / accommodation / other |
| description | text | 說明 |
| paid_by_member_id | uuid | 墊付人（null = 公基金支出） |
| expense_date | date | **費用發生日期**（非記帳時間！） |
| created_at | timestamptz | 記帳時間 |

### `fund_contributions`
| 欄位 | 型別 | 說明 |
|------|------|------|
| id | uuid | PK |
| trip_id | uuid | FK → trips |
| total_amount | numeric | 本次追加總額 |
| contributors | jsonb | `[{member_id, amount, nickname}]` |
| created_at | timestamptz | 追加時間（結算用時間序列） |

---

## 核心演算法：結算計算

> 詳見 `src/lib/settlement.ts`

### 時間序列墊付模型 (Chronological Advance Model)

1. 將 `fund_contributions` 和 `expenses` 按 `created_at` 排序合併成事件流
2. 維護 `runningFund`，contribution 加，expense 減
3. `advance = max(0, expense.amount - max(0, runningFund))`（只有超出餘額的部份算墊付）

### fairShare 計算（重要！）

```
totalAdvances = sum of all advances
totalPutIn = totalContributions + totalAdvances
fairShare = totalPutIn / n   ← 不能用 totalExpenses / n！
```

**為什麼**：使用 `totalExpenses/n` 時，`sum(balances) = current_fund ≠ 0`，結算演算法無法完成。
使用 `totalPutIn/n` 保證 `sum(balances) = 0`。

---

## 常見陷阱

| 陷阱 | 正確做法 |
|------|----------|
| `trip.initial_fund` 以為是總入帳 | 從 `fund_contributions` 加總 `total_amount` |
| Modal 被 Navbar backdrop-blur 遮擋 | 使用 `createPortal(content, document.body)` |
| 追加成員/基金後 UI 沒更新 | 呼叫 `router.refresh()` |
| `expense.created_at` 以為是費用日期 | 顯示 `expense.expense_date`（fallback created_at） |
| SSR 時用 `createPortal` | 加 `mounted` state，`useEffect(() => setMounted(true), [])` |

---

## 環境變數

| 變數 | 說明 |
|------|------|
| NEXT_PUBLIC_SUPABASE_URL | Supabase 專案 URL |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Supabase Anon Key |
| RESEND_API_KEY | Resend API Key |

---

## 部署指令

```bash
# 一鍵建置 + 部署
npm run build && git add -p && git commit && git push && vercel --prod
```
