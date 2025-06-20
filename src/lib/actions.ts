'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import {
  addPartner as dbAddPartner,
  registerSale as dbRegisterSale,
  redeemPoints as dbRedeemPoints,
  getPartnerByCoupon,
} from './mock-data';

const PartnerSchema = z.object({
  name: z.string().min(3, { message: 'Nome deve ter pelo menos 3 caracteres.' }),
  coupon: z.string().min(3, { message: 'Cupom deve ter pelo menos 3 caracteres.' }).regex(/^[A-Z0-9]+$/, { message: 'Cupom deve conter apenas letras maiúsculas e números.'}),
});

export async function addPartnerAction(prevState: any, formData: FormData) {
  const validatedFields = PartnerSchema.safeParse({
    name: formData.get('name'),
    coupon: formData.get('coupon'),
  });

  if (!validatedFields.success) {
    return {
      message: 'Erro de validação.',
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { name, coupon } = validatedFields.data;
  const result = await dbAddPartner(name, coupon.toUpperCase());

  if (result.success) {
    revalidatePath('/partners');
    revalidatePath('/reports');
    return { message: result.message, success: true, partner: result.partner };
  } else {
    return { message: result.message, success: false, errors: { coupon: [result.message] } };
  }
}

const SaleSchema = z.object({
  coupon: z.string().min(1, { message: 'Cupom é obrigatório.' }),
  totalSaleValue: z.coerce.number().positive({ message: 'Valor da venda deve ser positivo.' }),
});

export async function registerSaleAction(prevState: any, formData: FormData) {
  const validatedFields = SaleSchema.safeParse({
    coupon: formData.get('coupon'),
    totalSaleValue: formData.get('totalSaleValue'),
  });

  if (!validatedFields.success) {
    return {
      message: 'Erro de validação.',
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { coupon, totalSaleValue } = validatedFields.data;
  const result = await dbRegisterSale(coupon.toUpperCase(), totalSaleValue);

  if (result.success) {
    revalidatePath('/sales');
    revalidatePath('/partners');
    revalidatePath('/reports');
    return { 
      message: result.message, 
      success: true, 
      pointsGenerated: result.pointsGenerated, 
      discountedValue: result.discountedValue 
    };
  } else {
    return { message: result.message, success: false, errors: { coupon: [result.message] } };
  }
}

const RedemptionSchema = z.object({
  coupon: z.string().min(1, { message: 'Cupom é obrigatório.' }),
  pointsToRedeem: z.coerce.number().positive({ message: 'Pontos a resgatar devem ser positivos.' }),
});

export async function redeemPointsAction(prevState: any, formData: FormData) {
  const validatedFields = RedemptionSchema.safeParse({
    coupon: formData.get('coupon'),
    pointsToRedeem: formData.get('pointsToRedeem'),
  });

  if (!validatedFields.success) {
    return {
      message: 'Erro de validação.',
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }
  
  const { coupon, pointsToRedeem } = validatedFields.data;
  const partner = await getPartnerByCoupon(coupon.toUpperCase());
  if (!partner) {
    return { message: 'Cupom inválido.', success: false, errors: { coupon: ['Cupom inválido.'] } };
  }
  if (partner.points < pointsToRedeem) {
     return { message: 'Pontos insuficientes.', success: false, errors: { pointsToRedeem: ['Pontos insuficientes.'] } };
  }

  const result = await dbRedeemPoints(coupon.toUpperCase(), pointsToRedeem);

  if (result.success) {
    revalidatePath('/redemptions');
    revalidatePath('/partners');
    revalidatePath('/reports');
    return { message: result.message, success: true };
  } else {
     // This case should ideally be caught by pre-validation, but good to have
    const fieldErrors: Record<string, string[]> = {};
    if (result.message.toLowerCase().includes("cupom")) fieldErrors.coupon = [result.message];
    else if (result.message.toLowerCase().includes("pontos")) fieldErrors.pointsToRedeem = [result.message];
    else fieldErrors._form = [result.message]; // General error

    return { message: result.message, success: false, errors: fieldErrors };
  }
}
