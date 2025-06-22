// src/lib/mock-data.ts
// THIS FILE IS NOW BACKED BY SUPABASE.
import { getSupabase } from './supabase';
import type { Partner, Transaction } from '@/types';
import { TransactionType } from '@/types';
import { parseISO } from 'date-fns';


export async function getPartners(): Promise<{ partners?: Partner[]; error?: string }> {
  const { supabase, error } = getSupabase();
  if (error) return { error };

  const { data, error: dbError } = await supabase
    .from('partners_v2')
    .select('*')
    .order('name', { ascending: true });

  if (dbError) {
    console.error("Supabase getPartners error:", dbError);
    return { error: `Erro ao buscar parceiros: ${dbError.message}` };
  }

  return { partners: data };
}

export async function getPartnerByCoupon(coupon: string): Promise<{ partner?: Partner; error?: string }> {
  const { supabase, error } = getSupabase();
  if (error) return { error };

  const { data, error: dbError } = await supabase
    .from('partners_v2')
    .select('*')
    .eq('coupon', coupon.toUpperCase())
    .single();

  if (dbError && dbError.code !== 'PGRST116') { // PGRST116 = "The result contains 0 rows"
    console.error("Supabase getPartnerByCoupon error:", dbError);
    return { error: `Erro ao buscar parceiro: ${dbError.message}` };
  }

  return { partner: data || undefined };
}

export async function getPartnerById(id: string): Promise<{ partner?: Partner; error?: string }> {
  const { supabase, error } = getSupabase();
  if (error) return { error };
  
  const { data, error: dbError } = await supabase
    .from('partners_v2')
    .select('*')
    .eq('id', id)
    .single();

  if (dbError && dbError.code !== 'PGRST116') {
    console.error("Supabase getPartnerById error:", dbError);
    return { error: `Erro ao buscar parceiro por ID: ${dbError.message}` };
  }
  
  return { partner: data || undefined };
}

export async function addPartner(name: string, coupon: string): Promise<{ success: boolean; message: string; partner?: Partner, error?: string }> {
  const { supabase, error } = getSupabase();
  if (error) return { success: false, message: error, error };

  const existingPartnerResult = await getPartnerByCoupon(coupon);
  if (existingPartnerResult.error) return { success: false, message: existingPartnerResult.error, error: existingPartnerResult.error };
  if (existingPartnerResult.partner) {
    return { success: false, message: 'Cupom já existe.' };
  }
  if (!name.trim() || !coupon.trim()) {
    return { success: false, message: 'Nome e cupom são obrigatórios.' };
  }

  const { data, error: insertError } = await supabase
    .from('partners_v2')
    .insert({ name, coupon: coupon.toUpperCase(), points: 0 })
    .select()
    .single();

  if (insertError) {
    console.error("Supabase addPartner error:", insertError);
    return { success: false, message: `Erro ao adicionar parceiro: ${insertError.message}`, error: insertError.message };
  }
  
  return { success: true, message: 'Parceiro cadastrado com sucesso.', partner: data };
}

export async function registerSale(
  coupon: string, 
  totalSaleValue: number,
  externalSaleId?: string,
  saleDate?: string
): Promise<{ success: boolean; message: string; pointsGenerated?: number; discountedValue?: number; error?: string }> {
  const { supabase, error } = getSupabase();
  if (error) return { success: false, message: error, error };

  // Parameters are ordered alphabetically to match the corrected SQL function signature.
  const { data, error: rpcError } = await supabase.rpc('register_sale', {
    p_coupon: coupon.toUpperCase(),
    p_external_sale_id: externalSaleId || null,
    p_sale_date: saleDate || null,
    p_total_sale_value: totalSaleValue
  });

  if (rpcError) {
    console.error('Supabase registerSale RPC error:', rpcError);
    return { success: false, message: `Erro no RPC de venda: ${rpcError.message}`, error: rpcError.message };
  }

  const result = data[0];
  return {
    success: result.success,
    message: result.message,
    pointsGenerated: result.points_generated,
    discountedValue: result.discounted_value
  };
}

export async function redeemPoints(coupon: string, pointsToRedeem: number): Promise<{ success: boolean; message: string; error?: string }> {
  const { supabase, error } = getSupabase();
  if (error) return { success: false, message: error, error };

  const { data, error: rpcError } = await supabase.rpc('redeem_points', {
    p_coupon: coupon.toUpperCase(),
    p_points_to_redeem: pointsToRedeem
  });

  if (rpcError) {
    console.error('Supabase redeemPoints RPC error:', rpcError);
    return { success: false, message: `Erro no RPC de resgate: ${rpcError.message}`, error: rpcError.message };
  }

  const result = data[0];
  return {
    success: result.success,
    message: result.message,
    error: !result.success ? result.message : undefined
  };
}

export async function getAllTransactionsWithPartnerDetails(): Promise<{ transactions?: Transaction[]; error?: string }> {
  const { supabase, error } = getSupabase();
  if (error) return { error };

  const { data, error: dbError } = await supabase
    .from('transactions_v2')
    .select('*')
    .order('date', { ascending: false });
  
  if (dbError) {
    console.error("Supabase getAllTransactions error:", dbError);
    return { error: `Erro ao buscar transações: ${dbError.message}` };
  }
  return { transactions: data };
}

export async function getTransactionsForPartnerByDateRange(
  partnerId: string,
  startDateString?: string,
  endDateString?: string
): Promise<{ transactions?: Transaction[], error?: string }> {
  const { supabase, error } = getSupabase();
  if (error) return { error };

  let query = supabase
    .from('transactions_v2')
    .select('*')
    .eq('partnerId', partnerId);

  if (startDateString) {
    query = query.gte('date', parseISO(startDateString).toISOString());
  }
  if (endDateString) {
    query = query.lte('date', parseISO(endDateString).toISOString());
  }
  
  query = query.order('date', { ascending: false });

  const { data, error: dbError } = await query;
  
  if (dbError) {
    console.error("Supabase getTransactionsForPartner error:", dbError);
    return { error: `Erro ao buscar transações do parceiro: ${dbError.message}` };
  }

  return { transactions: data };
}
