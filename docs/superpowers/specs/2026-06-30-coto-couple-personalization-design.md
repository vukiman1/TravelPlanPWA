# Thiết kế: Cá nhân hoá "chuyến đôi" — An ❤ Linh + ảnh biển

Ngày: 2026-06-30

## 1. Mục tiêu & phạm vi

Đè một lớp **tình cảm hoá** mỏng lên bản redesign "Cô Tô 3N2Đ" (đang có trong working
tree, chưa commit). **Không** đổi theme, layout, repository, hay Supabase schema.

Ba việc:
1. **Tên đôi**: thay 1 tên người dùng (`username`) bằng cặp tên `Couple { you, partner }`,
   header chào **"An ❤ Linh"**.
2. **Câu chữ ngọt hơn** ở 3 chỗ: tên app/brand, tagline màn nhập tên, tên chuyến đi mặc định.
3. **Ảnh biển bìa**: dùng `public/coto-img.webp` làm cover hero ở đầu PlanPage và banner ở
   màn nhập tên.

Default câu chữ (chủ dự án chỉnh sau tuỳ ý):
- `APP_NAME` = **"Mình Đi Biển"**
- `APP_TAGLINE` = **"Kế hoạch cho chuyến đi của hai đứa 🌊"**
- `COTO_TRIP_NAME` = **"Cô Tô của tụi mình"**

Non-goals: đồng bộ tên qua DB (giữ local theo máy), đếm ngược ngày đi, upload ảnh riêng,
nén ảnh (ghi chú ở mục 10).

## 2. Constants

### Mới — `src/constants/app.ts`
```ts
export const APP_NAME = 'Mình Đi Biển'
export const APP_TAGLINE = 'Kế hoạch cho chuyến đi của hai đứa 🌊'
export const COVER_IMAGE_SRC = '/coto-img.webp'
export const COUPLE_STORAGE_KEY = 'trip-budget:couple'
```

### Sửa — `src/constants/trip.ts`
- `COTO_TRIP_NAME`: `'Cô Tô 3N2Đ'` → `'Cô Tô của tụi mình'`.
- **Gỡ** `USERNAME_STORAGE_KEY` (thay bằng `COUPLE_STORAGE_KEY` ở `app.ts`).
- Giữ `COTO_TRIP_ID`, `DEFAULT_DAY_COUNT`.

## 3. Couple model

### `src/types/trip.ts`
Thêm:
```ts
export interface Couple {
  you: string
  partner: string
}
```

### `src/store/trip-store.tsx`
- `TripStore.username: string` → `couple: Couple`.
- `TripStore.updateUsername` → `updateCouple(next: Couple): void`.
- Helper `readCouple(): Couple | null`: đọc `COUPLE_STORAGE_KEY`, `JSON.parse` trong `try/catch`;
  hợp lệ khi cả `you` và `partner` là chuỗi non-empty sau `trim`; ngược lại trả `null`.
- State: `couple: Couple | null` (init từ `readCouple()`), `status` init `'naming'` khi `readCouple()` null.
- `submitCouple(next: Couple)`: trim cả hai; nếu một trong hai rỗng thì bỏ qua; ngược lại ghi
  `localStorage` (JSON), set state, `loadTrip()`.
- `updateCouple(next: Couple)`: trim cả hai; nếu một trong hai rỗng thì **bỏ qua** (giữ giá trị cũ,
  không xoá) — mô phỏng hành vi `updateUsername` hiện tại.
- `value` (useMemo) trả `null` khi `!couple` (cạnh điều kiện `status`/`data` hiện có).
- Render: `status === 'naming'` → `<CoupleGate onSubmit={submitCouple} />`.

Key cũ `trip-budget:username` không còn được đọc — màn nhập tên hiện lại **một lần** để nhập 2 tên.

## 4. CoupleGate (đổi tên từ NameGate)

- Đổi tên file `src/components/NameGate.tsx` → `src/components/CoupleGate.tsx` (nội dung giờ là cặp tên).
- Props: `{ onSubmit: (couple: Couple) => void }`.
- 2 state `you`, `partner`. 2 ô **"Tên bạn"** (placeholder "VD: An") + **"Tên người ấy"** (placeholder "VD: Linh").
- Validate: cả hai non-empty (toast nếu thiếu). Enter trên ô cuối → submit.
- Đầu card: banner ảnh `COVER_IMAGE_SRC` (bo góc, phủ nhẹ) thay cho icon đơn; tiêu đề `APP_NAME`;
  mô tả `APP_TAGLINE`.

## 5. AppShell — header

- `useTripStore()` lấy `couple` thay `username`.
- Brand text dùng `APP_NAME` (import từ `constants/app`).
- Lời chào: `"Chào, {username}"` → **`{couple.you} ❤ {couple.partner}`** (giữ `truncate`, `min-w-0`).
  Ký tự tim tô màu `text-coral`.

## 6. CoverHero — `src/components/CoverHero.tsx`

- Props: `{ trip: Trip; couple: Couple }`.
- Thẻ bo góc (`rounded-card`, `shadow-card`, `overflow-hidden`) đặt **đầu PlanPage**, **trên**
  `SummaryHeader` (không bỏ thành phần nào).
- Ảnh `COVER_IMAGE_SRC` (`object-cover`, chiều cao cố định ~ `h-44 sm:h-52`), lớp phủ
  `bg-gradient-to-t from-ocean-deep/70` cho dễ đọc.
- Overlay chữ (canh đáy): tên chuyến `trip.name` (`font-display`, trắng), dòng phụ
  `{couple.you} ❤ {couple.partner}` + `· {trip.dayCount} ngày {nights} đêm`
  với `nights = Math.max(0, trip.dayCount - 1)`.
- PlanPage: import + render `<CoverHero trip={trip} couple={couple} />` ngay đầu khối, lấy thêm
  `couple` từ `useTripStore()`.

## 7. SettingsPage

- `useTripStore()` lấy `couple`, `updateCouple` thay `username`, `updateUsername`.
- Card "Người dùng" → **"Hai đứa mình"**: 2 ô (Tên bạn / Tên người ấy), draft state cục bộ;
  `onChange` gọi `updateCouple({ you, partner })`; `onBlur` khôi phục nếu rỗng (mô phỏng hành vi cũ).
- Subtitle trang: ngọt hơn, vd "Thông tin chuyến đi của hai đứa mình."

## 8. Brand build-time

- `vite.config.ts` (manifest): `name`/`short_name`/`description` đổi theo `APP_NAME` (chuỗi tĩnh,
  vì manifest là config build — chấp nhận trùng lặp nhẹ với `APP_NAME`).
- `index.html` `<title>`: đổi sang tên app mới.

## 9. Danh sách file

**Thêm:** `src/constants/app.ts`, `src/components/CoverHero.tsx`.

**Đổi tên:** `src/components/NameGate.tsx` → `src/components/CoupleGate.tsx`.

**Sửa:** `src/constants/trip.ts`, `src/types/trip.ts`, `src/store/trip-store.tsx`,
`src/components/layout/AppShell.tsx`, `src/pages/PlanPage.tsx`, `src/pages/SettingsPage.tsx`,
`vite.config.ts`, `index.html`.

**Không đụng:** theme/`index.css`, repositories, `supabase/schema.sql`, các view lịch trình,
StatsPage/StatsTable.

## 10. Edge cases & lưu ý

- `readCouple` bọc `JSON.parse` trong `try/catch` → dữ liệu hỏng coi như chưa nhập (về `naming`).
- `updateCouple` bỏ qua giá trị rỗng để không hiện "{you} ❤ " thiếu vế.
- Trip đã tạo trong Supabase với tên cũ "Cô Tô 3N2Đ" sẽ **giữ nguyên** ( `ensureTrip` dùng
  `ignoreDuplicates`); default mới chỉ áp cho DB trống. Đổi tên hiện tại qua Cài đặt.
- Ảnh `coto-img.webp` ~2.1 MB: là hero nên load ngay, chấp nhận được; nén xuống ~300–500 KB là
  việc tuỳ chọn sau, không thuộc phạm vi này.
- Brand string xuất hiện ở cả runtime (`APP_NAME`) lẫn build config (manifest, `<title>`) — đổi tên
  app cần sửa cả hai chỗ; ghi chú để không quên.

## 11. Gate kiểm thử

- `npm run build` (tsc strict, `noUnusedLocals/Parameters`) pass — đảm bảo không còn tham chiếu
  `username`/`USERNAME_STORAGE_KEY`/`NameGate`.
- `npm run lint` (oxlint) pass.
- Kiểm tra tay (`npm run dev`): màn nhập tên hiện 2 ô + banner ảnh → nhập An & Linh → header hiện
  "An ❤ Linh"; PlanPage có ảnh bìa + tên chuyến + "3 ngày 2 đêm"; Cài đặt sửa được 2 tên và lời chào
  đổi theo; tên app/brand mới ở header, màn nhập tên, tiêu đề tab.
