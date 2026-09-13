'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { Merchant } from '@/lib/types'

const merchantSchema = z.object({
  name: z.string().min(1, 'اسم التاجر مطلوب'),
  phone: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
})

type MerchantFormData = z.infer<typeof merchantSchema>

interface MerchantFormProps {
  merchant?: Merchant | null
  onClose: () => void
}

export default function MerchantForm({ merchant, onClose }: MerchantFormProps) {
  const queryClient = useQueryClient()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<MerchantFormData>({
    resolver: zodResolver(merchantSchema),
    defaultValues: merchant
      ? {
          name: merchant.name,
          phone: merchant.phone || '',
          address: merchant.address || '',
          notes: merchant.notes || '',
        }
      : {
          name: '',
          phone: '',
          address: '',
          notes: '',
        },
  })

  const mutation = useMutation({
    mutationFn: async (data: MerchantFormData) => {
      if (merchant) {
        const { error } = await supabase
          .from('merchants')
          .update({
            name: data.name,
            phone: data.phone || null,
            address: data.address || null,
            notes: data.notes || null,
          })
          .eq('id', merchant.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('merchants')
          .insert({
            name: data.name,
            phone: data.phone || null,
            address: data.address || null,
            notes: data.notes || null,
          })

        if (error) throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['merchants'] })
      onClose()
    },
  })

  const onSubmit = (data: MerchantFormData) => {
    mutation.mutate(data)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input
        label="اسم التاجر"
        {...register('name')}
        error={errors.name?.message}
      />

      <Input
        label="رقم الهاتف"
        {...register('phone')}
        error={errors.phone?.message}
      />

      <Input
        label="العنوان"
        {...register('address')}
        error={errors.address?.message}
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          ملاحظات
        </label>
        <textarea
          {...register('notes')}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {mutation.isError && (
        <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
          حدث خطأ أثناء الحفظ
        </div>
      )}

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="secondary" onClick={onClose}>
          إلغاء
        </Button>
        <Button type="submit" isLoading={mutation.isPending}>
          {merchant ? 'تحديث' : 'إضافة'}
        </Button>
      </div>
    </form>
  )
}
