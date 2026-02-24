# TripFun — Task Backlog

> 每次開始工作前先看這份清單，掌握目前狀態。

---

## 🐛 Bugs — 已修正 (2026-02-24)

| # | 說明 | 根本原因 | 修正檔案 | 狀態 |
|---|------|----------|----------|------|
| B-04 | 追加成員後回到旅程頁，成員人數沒有立即更新 | `handleAddMember` 缺少 `router.refresh()` | `MembersClient.tsx` | ✅ Fixed |
| B-05 | 第二次追加基金被計入「已用」金額 | `spent = initial_fund - current_fund`；`initial_fund` 不含 top-up | `FundBalanceCard.tsx` | ✅ Fixed |
| B-06 | 新增支出後，支出記錄頁面未立即更新 | `ExpensesPageClient` 的 `AddExpenseButton` 沒有傳入 `onExpenseAdded` 回呼 | `ExpensesPageClient.tsx` | ✅ Fixed |
| B-07 | 支出記錄只顯示記帳時間，未顯示費用發生日期 | 顯示 `created_at` 而非 `expense_date` | `ExpensesPageClient.tsx`, `ExpenseListClient.tsx` | ✅ Fixed |
| B-08 | 結算清單缺少部分債權人（如：圓仔花沒有人付給他） | `sum(balances) ≠ 0`：用 `totalExpenses` 作 fairShare 基準，導致有餘額時無法歸零 | `settlement.ts` | ✅ Fixed |
| B-09 | 結算清單：10 人還 ₩100，但結算頁顯示欠 ₩125 | 同 B-08，balance 不歸零，algorithm 無法完整結算 | `settlement.ts` | ✅ Fixed |

### B-05 根本原因詳述
```
spent = trip.initial_fund - trip.current_fund
```
- `initial_fund` 在建立旅程時設定，之後追加基金只更新 `current_fund`
- 追加 ₩1,350 後：`current_fund = ₩1,650`，`spent = ₩300 - ₩1,650 = -₩1,350`（負數！）
- **修正**：從實際支出記錄加總：`spent = expenses.reduce((s, e) => s + e.amount, 0)`

### B-08/09 根本原因詳述
```
// 原本：fairShare = totalExpenses / n
// 問題：sum(balance) = totalPutIn - totalExpenses = current_fund ≠ 0
```
當公基金有剩餘（current_fund > 0）時，正餘額總和 > 負餘額總和 → 結算演算法無法完成所有轉帳。
```
// 修正：fairShare = totalPutIn / n = (totalContributions + totalAdvances) / n
// 保證：sum(balance) = totalPutIn - n × (totalPutIn/n) = 0 ✓
```

---

## ✨ 已完成功能

| 功能 | 說明 | 上線日期 |
|------|------|----------|
| 旅程建立 | 目的地自動偵測幣別、匯率換算 | 2026-01 |
| 公基金 | 初始設定、追加、支出記帳 | 2026-01 |
| 結算計算 | 時間序列墊付模型（chronological advance） | 2026-02 |
| Modal Portal | 解決 Navbar backdrop-blur stacking context 問題 | 2026-02 |
| Email 報告 | Resend API，`onboarding@resend.dev` | 2026-02 |
| 旅程日期 | start_date / end_date，顯示在旅程頁 | 2026-02-24 |
| 費用日期 | expense_date，預設今天，限制在旅程期間內 | 2026-02-24 |
| 幣別顯示 | 旅程頁顯示記帳幣別 + 結帳幣別 | 2026-02-24 |
| 國家對應 | DESTINATION_CURRENCY_MAP 擴充至 35 國 | 2026-02-24 |

---

## 🔜 待辦 / 可考慮

- [ ] 支出編輯（目前只能刪除）
- [ ] 按費用日期排序（目前按 created_at）
- [ ] 結算後標記完成（哪些轉帳已執行）
- [ ] 推播通知（有人記帳時通知其他成員）
- [ ] 收據照片附件（Storage）
- [ ] 費用趨勢圖（按日期）
- [ ] 多語系（目前純中文）

---

## 🗄️ SQL Migrations Applied

```sql
-- 2026-02-24
ALTER TABLE trips ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS end_date DATE;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS expense_date DATE;
```
