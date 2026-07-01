# Thiết kế: Nav drawer khi điện thoại nằm ngang

Ngày: 2026-06-30

## 1. Mục tiêu & phạm vi

Khi điện thoại **nằm ngang** (màn thấp), thay thanh nav dưới bằng **nút hamburger ở góc
trái header** mở **drawer trượt từ trái** chứa 3 mục điều hướng. Portrait và màn cao
(tablet/desktop) **giữ nguyên** thanh nav dưới hiện tại. Chỉ đụng tầng layout.

Non-goals: đổi data layer, các trang, màu theme; nav dạng side-rail; xử lý landscape cho tablet/desktop.

## 2. Kích hoạt (detection)

Custom variant Tailwind v4 trong `src/index.css`:
```css
@custom-variant landscape-phone (@media (orientation: landscape) and (max-height: 600px));
```
Ngưỡng `max-height: 600px` tách điện thoại-ngang (~360–430px cao) khỏi tablet/desktop (cao hơn).

## 3. Hành vi

- **Portrait / màn cao**: thanh nav dưới như hiện tại; hamburger ẩn.
- **landscape-phone**: ẩn thanh dưới; hiện hamburger; bấm → drawer trượt từ trái với 3 mục
  (icon + nhãn + trạng thái active). Bấm mục → điều hướng + tự đóng. Đóng bằng: chọn mục /
  bấm nền mờ / Esc.

## 4. Thành phần

### `src/constants/navigation.ts` (mới)
Tách `NAV_ITEMS` khỏi `AppShell` để dùng chung thanh dưới + drawer:
```ts
interface NavItem { to: string; label: string; icon: LucideIcon }
export const NAV_ITEMS: readonly NavItem[]   // '/', '/stats', '/settings'
```

### `src/components/layout/NavDrawer.tsx` (mới)
- Radix Dialog (đã là dependency) → focus-trap, Esc, khóa scroll, a11y.
- Tự giữ state `open`. Trigger = nút hamburger `hidden landscape-phone:inline-flex` (chỉ hiện khi điện thoại ngang).
- `Dialog.Content`: `fixed left-0 top-0 h-dvh w-64 max-w-[80vw]`, viền phải, slide-in từ trái, `aria-describedby={undefined}`.
- `Dialog.Title` = `APP_NAME` (đầu drawer). Danh sách `NAV_ITEMS` bằng `NavLink`, `onClick` đóng drawer.

### `src/components/layout/AppShell.tsx` (sửa)
- Bỏ `NAV_ITEMS` cục bộ + import icon thừa; import `NAV_ITEMS` từ `constants/navigation`, import `NavDrawer`.
- Header: nhóm trái = `<NavDrawer />` + brand (hamburger ẩn ở portrait nên trái chỉ còn brand).
- Thanh dưới `<nav>`: thêm `landscape-phone:hidden`.
- `<main>` padding-bottom: thêm `landscape-phone:pb-[calc(1.5rem_+_env(safe-area-inset-bottom))]` (không còn thanh dưới).

### `src/index.css` (sửa)
- Thêm `@custom-variant landscape-phone (...)`.
- Thêm keyframe:
```css
@keyframes slide-in-left { from { opacity: 0; transform: translateX(-100%); } to { opacity: 1; transform: translateX(0); } }
```

## 5. Files

**Thêm:** `src/constants/navigation.ts`, `src/components/layout/NavDrawer.tsx`.
**Sửa:** `src/components/layout/AppShell.tsx`, `src/index.css`.

## 6. Edge cases & lưu ý

- Drawer dùng `NavLink` `onClick={() => setOpen(false)}` để đóng sau khi điều hướng (không phụ thuộc route đổi).
- `aria-describedby={undefined}` để Radix không cảnh báo thiếu Description.
- `h-dvh`/`max-w-[80vw]` đảm bảo drawer không tràn ở màn rất hẹp.
- Hamburger chỉ hiện ở `landscape-phone`; portrait không thừa nút.

## 7. Gate kiểm thử

- `npm run build` + `npm run lint` pass.
- Tay: portrait thấy thanh dưới như cũ; xoay ngang (DevTools responsive, ví dụ 740×360) thấy hamburger,
  bấm mở drawer trượt trái, chọn mục thì điều hướng + đóng; Esc/nền mờ đóng được.
