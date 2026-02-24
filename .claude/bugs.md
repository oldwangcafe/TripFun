# TripFun — Bug 歷史紀錄

> 已修正的 bug 與根本原因分析，供未來參考。

---

## 2026-02-24 Batch (B-04 ~ B-09)

### B-04 追加成員後旅程頁成員人數未更新
- **症狀**: 在成員頁新增成員後按返回，旅程詳情頁的「成員 12」數字不變
- **根本原因**: `MembersClient.handleAddMember` 只更新本地 state，未呼叫 `router.refresh()`
- **修正**: `src/app/(app)/trips/[id]/members/_components/MembersClient.tsx`
  ```ts
  // 在 handleAddMember 最後加入：
  router.refresh()
  ```

---

### B-05 第二次追加基金被計為「已用」金額
- **症狀**: 追加基金後，公基金卡片「已用」顯示負數（如「已用 ₩-1,350」）
- **根本原因**:
  ```ts
  // 舊程式碼：
  const spent = trip.initial_fund - trip.current_fund
  // initial_fund 建立時固定為 ₩300，追加後 current_fund = ₩1,650
  // spent = 300 - 1650 = -1350 ← 錯！
  ```
- **修正**: `src/app/(app)/trips/[id]/_components/FundBalanceCard.tsx`
  ```ts
  // 新程式碼：
  const spent = expenses.reduce((sum, e) => sum + e.amount, 0)
  const totalContributed = trip.current_fund + spent
  const percentage = totalContributed > 0 ? (trip.current_fund / totalContributed) * 100 : 0
  ```

---

### B-06 新增支出後支出記錄頁面未立即更新
- **症狀**: 在「支出記錄」頁面新增支出，關掉 Modal 後清單無變化
- **根本原因**: `ExpensesPageClient` 使用 `AddExpenseButton` 時沒有傳入 `onExpenseAdded` callback，而 `AddExpenseButton` 的 `router.refresh()` 是在 `TripDetailClient` 的 callback 裡執行的
- **修正**: `src/app/(app)/trips/[id]/expenses/_components/ExpensesPageClient.tsx`
  ```tsx
  <AddExpenseButton
    ...
    onExpenseAdded={(expense) => {
      setExpenses(prev => [optimisticExpense, ...prev])
      router.refresh()
    }}
  />
  ```

---

### B-07 支出列表日期顯示的是記帳時間，非費用發生日期
- **症狀**: 支出記錄顯示「2月24日 14:32」（created_at），應顯示費用日期
- **根本原因**: `formatDate(expense.created_at)` 而非 `expense.expense_date`
- **修正**: `ExpensesPageClient.tsx`, `ExpenseListClient.tsx`
  ```tsx
  // 改為：
  {expense.expense_date ? formatDate(expense.expense_date) : formatDate(expense.created_at)}
  ```

---

### B-08 結算清單部分債權人缺失（如圓仔花未收到付款）
### B-09 結算清單：10 人合計 ₩100，但剩餘顯示 ₩-125
- **症狀**: 結算頁只顯示「A 付給 Anca」，沒有人付給 圓仔花；而且付款總額與欠款金額不符
- **根本原因**: `sum(balances) ≠ 0`
  ```
  // 原本：
  fairShare = totalExpenses / n
  sum(balance) = sum(totalPutIn) - n × (totalExpenses/n)
               = (totalContributions + totalAdvances) - totalExpenses
               = current_fund  ← ≠ 0 當公基金有剩餘時！

  // 結果：正餘額總和 > 負餘額總和 → 演算法無法完整結算 → 圓仔花沒有人付
  ```
- **正確模型**:
  ```
  fairShare = totalPutIn / n = (totalContributions + totalAdvances) / n
  sum(balance) = totalPutIn - n × (totalPutIn/n) = 0 ✓
  ```
- **修正**: `src/lib/settlement.ts`
  ```ts
  // 在時間序列迴圈之後：
  const totalAdvances = Object.values(advances).reduce((sum, a) => sum + a, 0)
  const totalPutIn = totalContributions + totalAdvances
  const totalBasis = expenses.length > 0 ? totalPutIn : totalContributions
  const perPersonFairShare = members.length > 0 ? totalBasis / members.length : 0
  ```

---

## 2026-02-XX Batch (先前修正)

### 結算時間序列 Bug
- **症狀**: 蛋糕墊付應為 ₩4,000，卻計算為 ₩3,000
- **根本原因**: `runningFund = totalContributions`（包含後來追加的頂款），使運行餘額在處理支出前就偏高
- **修正**: 改用 event-stream 從 0 開始，依 created_at 排序交錯處理

### Modal 被 Navbar 遮擋
- **症狀**: TripActionMenu 彈出的 Modal 被頁面內容遮住
- **根本原因**: Modal 渲染在 Navbar 的 `rightAction` slot 內，Navbar 有 `backdrop-blur-md`，
  產生新的 stacking context，z-50 無法逃出 z-40 的 stacking context
- **修正**: Modal 改用 `createPortal(content, document.body)` 渲染在 body 層級

### Email 寄送失敗
- **根本原因**: `RESEND_API_KEY` 未設定，sender domain `tripfund.app` 未驗證
- **修正**: 設定 API Key；sender 改為 `onboarding@resend.dev`（Resend 預設無需驗證）
