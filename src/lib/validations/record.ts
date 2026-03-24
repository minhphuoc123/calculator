import { z } from 'zod'

export const createRecordSchema = z.object({
    recordDate: z.string().min(1, 'Ngày ghi nhận là bắt buộc'),
    packageTypeId: z.string().min(1, 'Gói dịch vụ là bắt buộc'),
    revenueBeforeVat: z
        .number({ message: 'Doanh thu chưa VAT phải là số' })
        .min(0, 'Doanh thu chưa VAT phải lớn hơn hoặc bằng 0'),
    costBeforeVat: z
        .number({ message: 'Giá vốn chưa VAT phải là số' })
        .min(0, 'Giá vốn chưa VAT phải lớn hơn hoặc bằng 0'),
    note: z.string().trim().max(1000, 'Ghi chú không được quá 1000 ký tự').optional(),
})