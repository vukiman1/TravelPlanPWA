# Thiết kế: Animation tinh tế (CSS thuần)

Ngày: 2026-07-01

## 1. Mục tiêu & phạm vi

Thêm animation tinh tế, mượt cho: chuyển view lịch trình, đóng/mở modal & drawer, nhấn nút.
CSS/Tailwind thuần — **không thêm thư viện**. Tôn trọng `prefers-reduced-motion`. Không đụng
data layer; không làm chuyển trang Plan/Stats/Settings.

## 2. Keyframes & reduced-motion — `src/index.css`

Thêm keyframes (đối xứng với cái đã có):
```css
@keyframes pop-out { from { opacity: 1; transform: translateY(0) scale(1); } to { opacity: 0; transform: translateY(8px) scale(.98); } }
@keyframes fade-out { from { opacity: 1; } to { opacity: 0; } }
@keyframes slide-out-left { from { opacity: 1; transform: translateX(0); } to { opacity: 0; transform: translateX(-100%); } }
@keyframes view-in { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
```

Reduced-motion (đặt trong `@layer base` hoặc cuối file):
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: .01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: .01ms !important;
  }
}
```

## 3. ViewSwitcher — indicator trượt

`src/components/plan/ViewSwitcher.tsx`:
- Container `relative`, bỏ `gap`, 3 nút `flex-1` bằng nhau, `z-10`, bg trong suốt.
- 1 indicator `absolute` (bg-ocean, bo tròn, `inset-y-1`, `left-1`, `width: calc((100% - .5rem)/3)`),
  dịch bằng `transform: translateX(calc(activeIndex * 100%))`, `transition-transform duration-300 ease-out`.
- Nút active `text-paper`, nút thường `text-ink-soft`; màu chữ `transition-colors`.
- `activeIndex` = vị trí của `value` trong `VIEW_OPTIONS`.

## 4. PlanPage — view ập vào khi đổi

`src/pages/PlanPage.tsx`: bọc phần render view (timeline/spending/activities) trong 1 `div`
với `key={view}` và `className="animate-[view-in_.22s_ease-out]"` → mỗi lần đổi view, container
remount và chạy `view-in`.

## 5. Modal — đóng/mở mượt

`src/components/plan/ItemModal.tsx`:
- Overlay: `data-[state=open]:animate-[fade_.15s_ease-out] data-[state=closed]:animate-[fade-out_.15s_ease-in]` (thay `animate-[fade_...]` tĩnh).
- Content: `data-[state=open]:animate-[pop_.16s_ease-out] data-[state=closed]:animate-[pop-out_.14s_ease-in]` (thay `animate-[pop_...]` tĩnh).
- Radix tự giữ mount tới khi animation `closed` xong. Giữ nguyên fix `onInteractOutside`.

## 6. Drawer — đóng/mở mượt

`src/components/layout/NavDrawer.tsx`:
- Overlay: giống modal (`fade` / `fade-out`).
- Content: `data-[state=open]:animate-[slide-in-left_.2s_ease-out] data-[state=closed]:animate-[slide-out-left_.18s_ease-in]`.

## 7. Button — phản hồi nhấn

`src/components/ui/Button.tsx`: đổi `transition-colors` → `transition` và thêm `active:scale-[0.97]`.

## 8. Files

**Sửa:** `src/index.css`, `src/components/plan/ViewSwitcher.tsx`, `src/pages/PlanPage.tsx`,
`src/components/plan/ItemModal.tsx`, `src/components/layout/NavDrawer.tsx`, `src/components/ui/Button.tsx`.

## 9. Edge cases & lưu ý

- ProgressBar đã có `transition-[width] duration-700` → không đổi.
- Indicator ViewSwitcher: dùng cùng công thức width/translate để khớp 3 segment bằng nhau; `p-1` = `.25rem` mỗi bên nên trừ `.5rem` khi tính width.
- Radix exit animation chỉ chạy khi Content/Overlay có animation ở `data-[state=closed]`; không cần `forceMount`.

## 10. Gate kiểm thử

- `npm run build` + `npm run lint` pass.
- Tay (`npm run dev`): đổi 3 view thấy indicator trượt + nội dung ập vào; mở/đóng modal & drawer mượt cả 2 chiều; nút bấm hơi lún; bật "reduce motion" của OS thì gần như tắt hiệu ứng.
