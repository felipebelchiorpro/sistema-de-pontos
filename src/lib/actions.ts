
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
import { getSupabase } from './supabase';

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
      title: "Erro de Validação",
      message: 'Dados inválidos.',
      errors: validatedFields.error.flatten().fieldErrors,
      success: false,
    };
  }

  const { name, coupon } = validatedFields.data;
  
  try {
    const result = await dbAddPartner(name, coupon.toUpperCase());

    if (result.error) {
       return {
        title: "Erro de Configuração",
        message: result.error,
        success: false,
        errors: { _form: [result.error] }
      };
    }

    if (result.success) {
      revalidatePath('/');
      revalidatePath('/partners');
      revalidatePath('/sales');
      revalidatePath('/redemptions');
      revalidatePath('/reports');
      revalidatePath('/transactions');
      return { title: "Sucesso!", message: result.message, success: true, partner: result.partner };
    } else {
      const errors: Record<string, string[]> = {};
      if (result.message.toLowerCase().includes('cupom')) {
        errors.coupon = [result.message];
      } else {
        errors._form = [result.message]; 
      }
      return { title: "Erro ao Adicionar", message: result.message, success: false, errors };
    }
  } catch (error: any) {
    console.error('Add Partner Action - Unexpected Error:', error);
    const errorMessage = `Ocorreu um erro inesperado: ${error.message || error}.`;
    return {
      title: "Erro Inesperado",
      message: errorMessage,
      success: false,
      errors: { _form: [errorMessage] }
    };
  }
}

const SaleSchema = z.object({
  coupon: z.string().min(1, { message: 'Cupom é obrigatório.' }),
  totalSaleValue: z.coerce.number().positive({ message: 'Valor da venda deve ser positivo.' }),
  externalSaleId: z.string().optional(),
  saleDate: z.string().optional(),
});

export async function registerSaleAction(prevState: any, formData: FormData) {
  const validatedFields = SaleSchema.safeParse({
    coupon: formData.get('coupon'),
    totalSaleValue: formData.get('totalSaleValue'),
    externalSaleId: formData.get('externalSaleId'),
    saleDate: formData.get('saleDate'),
  });

  if (!validatedFields.success) {
    return {
      title: "Erro de Validação",
      message: 'Dados inválidos.',
      errors: validatedFields.error.flatten().fieldErrors,
      success: false,
    };
  }

  const { coupon, totalSaleValue, externalSaleId, saleDate } = validatedFields.data;
  
  try {
    const result = await dbRegisterSale(coupon.toUpperCase(), totalSaleValue, externalSaleId || undefined, saleDate);
    
    if (result.error) {
       return {
        title: "Erro",
        message: result.error,
        success: false,
        errors: { _form: [result.error] }
      };
    }

    if (result.success) {
      revalidatePath('/');
      revalidatePath('/sales');
      revalidatePath('/partners');
      revalidatePath('/redemptions');
      revalidatePath('/reports');
      revalidatePath('/transactions');
      return {
        title: "Sucesso!",
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
      return { title: "Erro na Venda", message: result.message, success: false, errors: fieldErrors };
    }
  } catch (error: any) {
    console.error('Register Sale Action - Unexpected Error:', error);
    const errorMessage = `Ocorreu um erro inesperado: ${error.message || error}.`;
    return {
      title: "Erro Inesperado",
      message: errorMessage,
      success: false,
      errors: { _form: [errorMessage] }
    };
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
      title: "Erro de Validação",
      message: 'Dados inválidos.',
      errors: validatedFields.error.flatten().fieldErrors,
      success: false,
    };
  }
  
  try {
    const { coupon, pointsToRedeem } = validatedFields.data;
    const result = await dbRedeemPoints(coupon.toUpperCase(), pointsToRedeem);
    
    if (result.error) {
       const fieldErrors: Record<string, string[]> = {};
       const lowerCaseError = result.error.toLowerCase();
       
       if (lowerCaseError.includes("configuração")) {
          fieldErrors._form = [result.error];
       } else if (lowerCaseError.includes("cupom")) {
         fieldErrors.coupon = [result.error];
       } else if (lowerCaseError.includes("pontos insuficientes")) {
         fieldErrors.pointsToRedeem = [result.error];
       } else {
         fieldErrors._form = [result.error];
       }
       return { title: "Erro no Resgate", message: result.error, success: false, errors: fieldErrors };
    }


    if (result.success) {
      revalidatePath('/');
      revalidatePath('/redemptions');
      revalidatePath('/partners');
      revalidatePath('/sales');
      revalidatePath('/reports');
      revalidatePath('/transactions');
      return { title: "Sucesso!", message: result.message, success: true, errors: {} };
    } else {
      const fieldErrors: Record<string, string[]> = {};
      if (result.message.toLowerCase().includes("cupom")) fieldErrors.coupon = [result.message];
      else if (result.message.toLowerCase().includes("pontos")) fieldErrors.pointsToRedeem = [result.message];
      else fieldErrors._form = [result.message];

      return { title: "Erro no Resgate", message: result.message, success: false, errors: fieldErrors };
    }
  } catch (error: any) {
    console.error('Redeem Points Action - Unexpected Error:', error);
    const errorMessage = `Ocorreu um erro inesperado: ${error.message || error}.`;
    return {
      title: "Erro Inesperado",
      message: errorMessage,
      success: false,
      errors: { _form: [errorMessage] }
    };
  }
}

export async function fetchIndividualPartnerReportDataAction(
  partnerId: string,
  startDate?: string,
  endDate?: string
): Promise<{ partner?: Partner; transactions?: Transaction[]; error?: string }> {
  try {
    const partnerResult = await getPartnerById(partnerId);
    if (partnerResult.error) return { error: partnerResult.error };
    if (!partnerResult.partner) {
      return { error: "Parceiro não encontrado." };
    }
    
    const transactionsResult = await getTransactionsForPartnerByDateRange(partnerId, startDate, endDate);
    if (transactionsResult.error) return { error: transactionsResult.error };

    return { partner: partnerResult.partner, transactions: transactionsResult.transactions || [] };
  } catch (e: any) {
    console.error("Error fetching individual partner report data:", e);
    return { error: "Erro ao buscar dados do relatório individual." };
  }
}

export async function testSupabaseConnectionAction(): Promise<{ success: boolean; message: string; }> {
  const { supabase, error } = getSupabase();

  if (error) {
    return { success: false, message: `A inicialização do Supabase falhou. Motivo: ${error}` };
  }
  
  if (!supabase) {
     return { success: false, message: 'A instância do Supabase não está disponível, mas nenhum erro explícito foi retornado. Isso é um estado inesperado.' };
  }

  try {
    // Attempt to fetch a single row. This tests connection, URL, anon key, and RLS policies for read.
    const { error: dbError } = await supabase.from('partners_v2').select('id').limit(1);

    if (dbError) {
      if (dbError.message.includes('JWT') || dbError.message.includes('anon key')) {
        return { success: false, message: `Erro de autenticação com o Supabase: ${dbError.message}. Verifique se a 'NEXT_PUBLIC_SUPABASE_ANON_KEY' está correta.` };
      }
      if (dbError.message.includes('fetch')) {
         return { success: false, message: `Erro de rede ao conectar ao Supabase: ${dbError.message}. Verifique se a 'NEXT_PUBLIC_SUPABASE_URL' está correta e se não há problemas de CORS.` };
      }
       return { success: false, message: `Erro ao comunicar com o Supabase: ${dbError.message}. Verifique se a tabela 'partners_v2' existe e se as políticas de RLS permitem leitura.` };
    }
    
    return { success: true, message: 'Conexão com o Supabase estabelecida com sucesso!' };

  } catch (e: any) {
    return { success: false, message: `Erro inesperado durante o teste: ${e.message}` };
  }
}
