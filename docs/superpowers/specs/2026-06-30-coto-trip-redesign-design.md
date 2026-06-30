# Thiết kế: Single-trip "Cô Tô 3N2Đ" + Lịch trình đa view

Ngày: 2026-06-30

## 1. Mục tiêu & phạm vi

Chuyển app từ mô hình "nhiều chuyến đi + onboarding tạo/mở/seed" sang **một chuyến đi
duy nhất** `Cô Tô 3N2Đ`, thêm bước nhập tên người dùng, và tách trang Lịch trình thành
nhiều view trực quan. Phạm vi chỉ trong các thay đổi liệt kê dưới; không refactor ngoài lề.

Quyết định đã chốt với chủ dự án:
1. Trip dùng **ID cố định trong code**, lần đầu tự tạo chuyến **rỗng**; mọi thiết bị mở cùng dữ liệu.
2. Lịch trình tách 3 view: **Thời gian · Chi tiêu · Hoạt động**.
3. Thống kê: **giữ biểu đồ + thêm bảng** chi tiết từng khoản.
4. Tên người dùng: **lời chào ở header + sửa ở Cài đặt**, lưu `localStorage`.

Non-goals: auth, đồng bộ/sao lưu thủ công (QR/export/import), tạo nhiều chuyến đi, đổi chuyến.

## 2. Constants mới — `src/constants/trip.ts`

```ts
export const COTO_TRIP_ID = 'c0700000-0000-4000-8000-000000000001'
export const COTO_TRIP_NAME = 'Cô Tô 3N2Đ'
export const DEFAULT_DAY_COUNT = 3
export const USERNAME_STORAGE_KEY = 'trip-budget:username'
```

`COTO_TRIP_ID` là UUID hợp lệ, cố định → `ensureTrip` idempotent và mọi thiết bị trỏ cùng row.

## 3. Tầng dữ liệu

### `trip.repository.ts`
- Thêm `ensureTrip(): Promise<Trip>`:
  - `supabase.from('trips').upsert({ id: COTO_TRIP_ID, name: COTO_TRIP_NAME, total_budget: 0, day_count: DEFAULT_DAY_COUNT, start_date: null }, { onConflict: 'id', ignoreDuplicates: true })` → `INSERT ... ON CONFLICT DO NOTHING`, **không** ghi đè dữ liệu đã có.
  - Sau đó `fetchTrip(COTO_TRIP_ID)`; nếu null thì ném `SupabaseError`.
- Gỡ `createTrip` và `CreateTripInput` (không còn UI tạo mới).
- Giữ `fetchTrip`, `updateTrip`.

### `item.repository.ts`
- Không đổi logic. `insertItems` chỉ còn được dùng nếu cần — kiểm tra sau khi gỡ store; nếu không còn call site thì xóa luôn (không để dead code).

### `trip-store.tsx`
- `type Status = 'naming' | 'loading' | 'ready' | 'error'`.
- State: `username: string | null` (khởi tạo từ `localStorage`), `data: TripData | null`, `status`.
  Bỏ hẳn `activeId` và `ACTIVE_KEY`.
- `loadTrip()`: set `loading` → `ensureTrip()` → `fetchItems(COTO_TRIP_ID)` → set `data` + `ready`;
  lỗi → `error` + toast.
- Effect khởi động: nếu `username` có → `loadTrip()`; nếu không → `status = 'naming'`.
- `submitName(name: string)`: lưu `localStorage[USERNAME_STORAGE_KEY]`, set `username`, rồi `loadTrip()`.
- `updateUsername(name: string)`: trim; nếu rỗng thì bỏ qua; ngược lại ghi `localStorage` + set state.
- Mutations (`updateTrip`, `upsertItem`, `deleteItem`, `addDay`) dùng thẳng `COTO_TRIP_ID`, giữ optimistic + `reload()` khi lỗi.
- Gỡ: `importData`, `resetToSample`, `switchTrip`, `createAndOpen`, `createFromData`, `openByCode`,
  import `INITIAL_*`, import `Onboarding`.
- Render theo status:
  - `naming` → `<NameGate onSubmit={submitName} />`
  - `loading` → `<LoadingScreen />`
  - `error` → `<ErrorScreen onRetry={reload} />` (bỏ `onSwitch`)
  - `ready` → Provider.

`TripStore` interface mới:
```ts
interface TripStore {
  trip: Trip
  items: TripItem[]
  username: string
  updateTrip: (patch: Partial<Trip>) => void
  upsertItem: (item: TripItem) => void
  deleteItem: (id: string) => void
  addDay: () => void
  updateUsername: (name: string) => void
}
```
`TripData` giữ nguyên (vẫn dùng nội bộ cho `data`).

## 4. Username & NameGate

- **Xóa** `src/components/Onboarding.tsx`. **Thêm** `src/components/NameGate.tsx`:
  - Props: `{ onSubmit: (name: string) => void }`.
  - 1 input "Tên của bạn", nút "Bắt đầu". Validate trim không rỗng (toast nếu rỗng). Tái dùng style logo/title như Onboarding cũ.
- `AppShell` gọi `useTripStore()` lấy `username`, hiện "Chào, {username}" bên phải header (truncate trên mobile).

## 5. Lịch trình — `PlanPage` + 3 view

Bố cục PlanPage:
1. `SummaryHeader` (giữ nguyên) — tổng quan ngân sách, luôn hiển thị.
2. Hàng điều khiển: `ViewSwitcher` (segmented control) + nút primary "Thêm" (mở `ItemModal`, mặc định ngày 1).
3. View đang chọn.
4. `ItemModal` (giữ nguyên) dùng chung — state modal nằm ở PlanPage, truyền `openEdit/openCreate` xuống các view.

`ViewSwitcher.tsx`: export `type PlanView = 'timeline' | 'spending' | 'activities'` + component segmented control 3 lựa chọn (`Thời gian` / `Chi tiêu` / `Hoạt động`). State view nằm ở PlanPage (`useState<PlanView>('timeline')`).

### `TimelineView.tsx`
- Dùng `groupByDay(items, trip.dayCount)`.
- Mỗi ngày: header (Ngày N + ngày tháng nếu có `startDate`), danh sách item dạng **dòng thời gian dọc** (mốc giờ + chấm + đường nối + thẻ hoạt động: tên, `CategoryBadge`, ghi chú, dự kiến/thực tế, `StatusBadge`).
- Item bấm → `openEdit`. Mỗi ngày có nút "Thêm hoạt động" (→ `openCreate(dayNumber)`).
- Cuối danh sách: nút "Thêm ngày" (→ `addDay`).
- Empty: ngày trống hiện "Chưa có hoạt động nào trong ngày này."

### `SpendingView.tsx`
- Dùng `groupByDay`.
- Mỗi ngày: tiêu đề + subtotal (dự kiến vs thực tế) + mini `ProgressBar` (actual/planned, đổi màu khi vượt). Bên dưới liệt kê từng khoản: hoạt động, `CategoryBadge`, dự kiến, thực tế, `StatusBadge`. Bấm → `openEdit`.
- Empty: "Chưa có khoản chi nào."

### `ActivitiesView.tsx`
- Dùng `groupByCategory(items)` (helper mới) — nhóm theo **danh mục**, xuyên ngày.
- Mỗi nhóm: tiêu đề danh mục (icon + label + subtotal) + danh sách hoạt động kèm tag "Ngày N · giờ" và `StatusBadge`. Bấm → `openEdit`.
- Empty: "Chưa có hoạt động nào."

**Gỡ** `src/components/plan/DayGroup.tsx` và `src/components/plan/ItemRow.tsx` (không còn call site). Giữ `CategoryBadge`, `StatusBadge`, `ItemModal`.

## 6. Thống kê — `StatsPage`

- **Giữ** pie theo danh mục + bar dự kiến/thực tế theo ngày (recharts).
- **Thêm** `src/components/stats/StatsTable.tsx` (read-only):
  - Dùng `groupByDay(items, trip.dayCount)`.
  - Mỗi ngày: header ngày + subtotal; các dòng item với cột `Giờ · Hoạt động · Danh mục · Dự kiến · Thực tế · Trạng thái`.
  - Dòng tổng cuối (dự kiến/thực tế toàn chuyến).
  - Responsive: bảng cuộn ngang trên mobile (`overflow-x-auto`), không cần layout stacked riêng.
  - Empty: tái dùng kiểu `EmptyChart` ("Chưa có dữ liệu…").

## 7. Cài đặt — `SettingsPage`

- **Xóa** card "Đồng bộ thiết bị" (QR, copy mã, `switchTrip`, `syncLink`) và "Sao lưu dữ liệu" (export/import/`resetToSample`). Gỡ import `qrcode.react`, `useRef`, các handler liên quan.
- **Giữ** "Thông tin chuyến đi" (tên, tổng ngân sách, số ngày, ngày bắt đầu → `updateTrip`) và "Danh mục chi tiêu".
- **Thêm** card "Người dùng": input tên ràng buộc `username`, `onChange` → `updateUsername`.
- Sửa mô tả trang: bỏ "đồng bộ và sao lưu" (vd: "Thông tin chuyến đi và tài khoản của bạn.").
- `package.json`: `npm uninstall qrcode.react` (không còn dùng ở đâu).

## 8. `budget.service.ts`

Thêm hàm thuần:
```ts
export interface CategoryGroup {
  categoryId: CategoryId
  items: TripItem[]
  plannedTotal: number
  actualTotal: number
}
export function groupByCategory(items: TripItem[]): CategoryGroup[]
```
- Duyệt theo thứ tự `CATEGORY_IDS`, chỉ trả nhóm có item; trong nhóm sort theo `dayNumber` rồi `time`.
- Tái dùng `groupByDay`, `computeSummary`, `totalsByCategory`, `totalsByDay` (không đổi).

## 9. Danh sách file

**Thêm:** `src/constants/trip.ts`, `src/components/NameGate.tsx`,
`src/components/plan/ViewSwitcher.tsx`, `src/components/plan/TimelineView.tsx`,
`src/components/plan/SpendingView.tsx`, `src/components/plan/ActivitiesView.tsx`,
`src/components/stats/StatsTable.tsx`.

**Sửa:** `src/store/trip-store.tsx`, `src/repositories/trip.repository.ts`,
`src/pages/PlanPage.tsx`, `src/pages/StatsPage.tsx`, `src/pages/SettingsPage.tsx`,
`src/components/layout/AppShell.tsx`, `src/services/budget.service.ts`, `package.json`.

**Xóa:** `src/data/mock.ts`, `src/components/Onboarding.tsx`,
`src/components/plan/DayGroup.tsx`, `src/components/plan/ItemRow.tsx`.
(Kiểm tra `insertItems` trong `item.repository.ts` — xóa nếu mất hết call site.)

## 10. Edge cases & lưu ý

- `ensureTrip` chạy mỗi lần load; `ignoreDuplicates` đảm bảo không clobber. Hai thiết bị mở đồng thời lần đầu → `ON CONFLICT DO NOTHING` an toàn.
- `username` rỗng: NameGate chỉ kích hoạt khi **thiếu key**; `updateUsername` bỏ qua giá trị rỗng để không hiện "Chào, ".
- `dayCount` vẫn chỉnh ở Settings; "Thêm ngày" ở TimelineView là phím tắt.
- Query `?trip=` cũ không còn dùng — không xử lý, gỡ khỏi Settings.

## 11. Gate kiểm thử

- `npm run build` (tsc strict, `noUnusedLocals/Parameters`) phải pass.
- `npm run lint` (oxlint) phải pass.
- Kiểm tra tay qua `npm run dev`: nhập tên lần đầu → vào app rỗng; thêm hoạt động; chuyển 3 view; bảng Thống kê; sửa tên ở Cài đặt thấy lời chào đổi.
