'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import {
  addPartner as dbAddPartner,
  registerSale as dbRegisterSale,
  redeemPoints as dbRedeemPoints,
  getPartnerByCoupon,
  getPartnerById,
  getTransactionsForPartnerByDateRange,
} from './mock-data';
import type { Partner, Transaction } from '@/types';

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
      success: false,
    };
  }

  const { name, coupon } = validatedFields.data;
  const result = await dbAddPartner(name, coupon.toUpperCase());

  if (result.success) {
    revalidatePath('/partners');
    revalidatePath('/reports');
    return { message: result.message, success: true, partner: result.partner };
  } else {
    const errors: Record<string, string[]> = {};
    if (result.message.toLowerCase().includes('cupom')) {
      errors.coupon = [result.message];
    } else {
      errors._form = [result.message]; 
    }
    return { message: result.message, success: false, errors };
  }
}

const SaleSchema = z.object({
  coupon: z.string().min(1, { message: 'Cupom é obrigatório.' }),
  totalSaleValue: z.coerce.number().positive({ message: 'Valor da venda deve ser positivo.' }),
  externalSaleId: z.string().optional(),
});

export async function registerSaleAction(prevState: any, formData: FormData) {
  const validatedFields = SaleSchema.safeParse({
    coupon: formData.get('coupon'),
    totalSaleValue: formData.get('totalSaleValue'),
    externalSaleId: formData.get('externalSaleId'),
  });

  if (!validatedFields.success) {
    return {
      message: 'Erro de validação.',
      errors: validatedFields.error.flatten().fieldErrors,
      success: false,
    };
  }

  const { coupon, totalSaleValue, externalSaleId } = validatedFields.data;
  const result = await dbRegisterSale(coupon.toUpperCase(), totalSaleValue, externalSaleId || undefined);

  if (result.success) {
    revalidatePath('/sales');
    revalidatePath('/partners');
    revalidatePath('/reports');
    revalidatePath('/');
    return {
      message: result.message,
      success: true,
      pointsGenerated: result.pointsGenerated,
      discountedValue: result.discountedValue
    };
  } else {
    const fieldErrors: Record<string, string[]> = {};
    if (result.message.toLowerCase().includes("cupom")) {
      fieldErrors.coupon = [result.message];
    } else if (result.message.toLowerCase().includes("valor da venda") || result.message.toLowerCase().includes("valor")) {
      fieldErrors.totalSaleValue = [result.message];
    } else {
      fieldErrors._form = [result.message]; 
    }
    return { message: result.message, success: false, errors: fieldErrors };
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
      success: false,
    };
  }

  const { coupon, pointsToRedeem } = validatedFields.data;
  const partner = await getPartnerByCoupon(coupon.toUpperCase());

  if (!partner) {
    return { message: 'Cupom inválido.', success: false, errors: { coupon: ['Cupom inválido.'] } };
  }
  if (partner.points < pointsToRedeem) {
     return { message: 'Pontos insuficientes para resgate.', success: false, errors: { pointsToRedeem: ['Pontos insuficientes para resgate.'] } };
  }

  const result = await dbRedeemPoints(coupon.toUpperCase(), pointsToRedeem);

  if (result.success) {
    revalidatePath('/redemptions');
    revalidatePath('/partners');
    revalidatePath('/reports');
    revalidatePath('/');
    return { message: result.message, success: true, errors: {} };
  } else {
    const fieldErrors: Record<string, string[]> = {};
    if (result.message.toLowerCase().includes("cupom")) fieldErrors.coupon = [result.message];
    else if (result.message.toLowerCase().includes("pontos")) fieldErrors.pointsToRedeem = [result.message];
    else fieldErrors._form = [result.message];

    return { message: result.message, success: false, errors: fieldErrors };
  }
}

export async function fetchPartnerPointsAction(coupon: string): Promise<{ points: number | null; error?: string }> {
  if (!coupon || coupon.trim().length < 3) { 
    return { points: null, error: "Cupom deve ter pelo menos 3 caracteres." };
  }
  try {
    const partner = await getPartnerByCoupon(coupon.toUpperCase());
    if (partner) {
      return { points: partner.points, error: undefined };
    }
    return { points: null, error: "Cupom não encontrado." };
  } catch (e: any) {
    console.error("Error fetching partner points:", e);
    return { points: null, error: "Erro ao buscar pontos do parceiro." };
  }
}

export async function fetchIndividualPartnerReportDataAction(
  partnerId: string,
  startDate?: string,
  endDate?: string
): Promise<{ partner: Partner; transactions: Transaction[] } | { error: string }> {
  try {
    const partner = await getPartnerById(partnerId);
    if (!partner) {
      return { error: "Parceiro não encontrado." };
    }
    const transactions = await getTransactionsForPartnerByDateRange(partnerId, startDate, endDate);
    return { partner, transactions };
  } catch (e: any) {
    console.error("Error fetching individual partner report data:", e);
    return { error: "Erro ao buscar dados do relatório individual." };
  }
}
