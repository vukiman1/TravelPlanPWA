import type { Trip, TripItem } from '@/types/trip'

export const INITIAL_TRIP: Trip = {
  id: 'demo-bien-3n2d',
  name: 'Kế hoạch đi biển 3 ngày 2 đêm',
  totalBudget: 10_000_000,
  dayCount: 3,
  startDate: null,
  currency: 'VND',
}

export const INITIAL_ITEMS: TripItem[] = [
  { id: 'i1', dayNumber: 1, time: '14:00', activity: 'Đến nơi, nhận phòng khách sạn', category: 'accommodation', plannedAmount: 0, actualAmount: 2_000_000, status: 'paid', note: 'Nhận phòng sớm nếu có thể', sortOrder: 1 },
  { id: 'i2', dayNumber: 1, time: '15:30', activity: 'Tắm biển, dạo quanh', category: 'entertainment', plannedAmount: 0, actualAmount: null, status: 'paid', note: 'Mang theo kem chống nắng', sortOrder: 2 },
  { id: 'i3', dayNumber: 1, time: '18:30', activity: 'Ăn tối hải sản', category: 'food', plannedAmount: 1_200_000, actualAmount: null, status: 'unpaid', note: 'Nhà hàng ven biển', sortOrder: 3 },
  { id: 'i4', dayNumber: 1, time: '20:30', activity: 'Đi dạo chợ đêm', category: 'shopping', plannedAmount: 500_000, actualAmount: null, status: 'unpaid', note: 'Mua đồ lặt vặt', sortOrder: 4 },
  { id: 'i5', dayNumber: 2, time: '05:30', activity: 'Ngắm bình minh', category: 'entertainment', plannedAmount: 0, actualAmount: null, status: 'paid', note: 'Dậy sớm', sortOrder: 1 },
  { id: 'i6', dayNumber: 2, time: '07:30', activity: 'Ăn sáng', category: 'food', plannedAmount: 300_000, actualAmount: null, status: 'unpaid', note: 'Ăn bún hải sản', sortOrder: 2 },
  { id: 'i7', dayNumber: 2, time: '09:00', activity: 'Đi tour đảo', category: 'entertainment', plannedAmount: 1_500_000, actualAmount: null, status: 'paid', note: 'Đã đặt trước qua đại lý', sortOrder: 3 },
  { id: 'i8', dayNumber: 2, time: '18:30', activity: 'Ăn tối', category: 'food', plannedAmount: 800_000, actualAmount: null, status: 'unpaid', note: 'Ăn tại trung tâm', sortOrder: 4 },
  { id: 'i9', dayNumber: 3, time: '08:00', activity: 'Ăn sáng', category: 'food', plannedAmount: 1_500_000, actualAmount: null, status: 'unpaid', note: 'Ăn buffet khách sạn', sortOrder: 1 },
  { id: 'i10', dayNumber: 3, time: '09:30', activity: 'Mua đặc sản', category: 'shopping', plannedAmount: 1_000_000, actualAmount: null, status: 'unpaid', note: 'Mua mực khô, chả cá', sortOrder: 2 },
  { id: 'i11', dayNumber: 3, time: '11:30', activity: 'Trả phòng khách sạn', category: 'accommodation', plannedAmount: 0, actualAmount: null, status: 'paid', note: 'Kiểm tra lại hành lý', sortOrder: 3 },
  { id: 'i12', dayNumber: 3, time: '12:30', activity: 'Di chuyển về', category: 'transport', plannedAmount: 600_000, actualAmount: null, status: 'paid', note: 'Đặt xe trước', sortOrder: 4 },
]
