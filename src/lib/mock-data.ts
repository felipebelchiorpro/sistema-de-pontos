// src/lib/mock-data.ts
// src/lib/mock-data.ts
// THIS FILE IS NOW BACKED BY SUPABASE.
import { getSupabase } from './supabase';
import { pb } from './pocketbase';
import type { Partner, Transaction, PartnerFormValues } from '@/types';
import { TransactionType } from '@/types';
import { parseISO } from 'date-fns';


export async function getPartners(): Promise<{ partners?: Partner[]; error?: string }> {
  try {
    const records = await pb.collection('partners').getFullList({
      sort: 'name',
    });
    return { partners: records as unknown as Partner[], error: undefined };
  } catch (err: any) {
    return { partners: undefined, error: err.message || "Erro desconhecido" };
  }
}

export async function updatePartner(id: string, updates: Partial<PartnerFormValues>) {
  try {
    const record = await pb.collection('partners').update(id, updates);
    return { partner: record as unknown as Partner, error: null };
  } catch (err: any) {
    return { partner: null, error: err.message || "Erro desconhecido" };
  }
}

export async function deletePartner(id: string) {
  try {
    await pb.collection('partners').delete(id);
    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err.message || "Erro desconhecido" };
  }
}

export async function getPartnerByCoupon(coupon: string): Promise<{ partner?: Partner; error?: string }> {
  try {
    const record = await pb.collection('partners').getFirstListItem(`coupon = "${coupon.toUpperCase()}"`);
    return { partner: record as unknown as Partner, error: undefined };
  } catch (err: any) {
    return { partner: undefined, error: err.status === 404 ? undefined : (err.message || "Erro desconhecido") };
  }
}

export async function getPartnerById(id: string): Promise<{ partner?: Partner; error?: string }> {
  try {
    const record = await pb.collection('partners').getOne(id);
    return { partner: record as unknown as Partner, error: undefined };
  } catch (err: any) {
    return { partner: undefined, error: err.message || "Erro desconhecido" };
  }
}

export async function addPartner(name: string, coupon: string): Promise<{ success: boolean; message: string; partner?: Partner, error?: string }> {
  const existingPartnerResult = await getPartnerByCoupon(coupon);
  if (existingPartnerResult.error && existingPartnerResult.error !== null) return { success: false, message: existingPartnerResult.error, error: existingPartnerResult.error };
  if (existingPartnerResult.partner) {
    return { success: false, message: 'Cupom já existe.' };
  }
  if (!name.trim() || !coupon.trim()) {
    return { success: false, message: 'Nome e cupom são obrigatórios.' };
  }

  try {
    const record = await pb.collection('partners').create({ name, coupon: coupon.toUpperCase(), points: 0 });
    return { success: true, message: 'Parceiro cadastrado com sucesso.', partner: record as unknown as Partner };
  } catch (err: any) {
    console.error("PocketBase addPartner error:", err);
    return { success: false, message: `Erro ao adicionar parceiro: ${err.message} `, error: err.message };
  }
}

export async function registerSale(
  coupon: string,
  totalSaleValue: number,
  externalSaleId?: string,
  saleDate?: string
): Promise<{ success: boolean; message: string; pointsGenerated?: number; discountedValue?: number; error?: string }> {
  const partnerResult = await getPartnerByCoupon(coupon);
  if (partnerResult.error && partnerResult.error !== null) {
    return { success: false, message: partnerResult.error, error: partnerResult.error };
  }
  if (!partnerResult.partner) {
    return { success: false, message: 'Parceiro não encontrado para o cupom fornecido.' };
  }

  const pointsGenerated = Math.floor(totalSaleValue / 10); // Example logic: 1 point per 10 units of sale
  const transactionData = {
    partnerId: partnerResult.partner.id,
    type: TransactionType.SALE,
    amount: pointsGenerated,
    originalSaleValue: totalSaleValue,
    discountedValue: 0, // Sales don't have discounted value
    externalSaleId: externalSaleId || undefined, // undefined instead of null
    date: saleDate || new Date().toISOString(),
  };

  try {
    const { transaction, error } = await addTransaction(transactionData);
    if (error) throw new Error(error);
    return {
      success: true,
      message: 'Venda registrada com sucesso.',
      pointsGenerated: pointsGenerated,
      discountedValue: Number((totalSaleValue - (totalSaleValue * 0.075)).toFixed(2)),
    };
  } catch (err: any) {
    console.error('PocketBase registerSale error:', err);
    return { success: false, message: `Erro ao registrar venda: ${err.message} `, error: err.message };
  }
}

export async function redeemPoints(coupon: string, pointsToRedeem: number): Promise<{ success: boolean; message: string; error?: string }> {
  const partnerResult = await getPartnerByCoupon(coupon);
  if (partnerResult.error && partnerResult.error !== null) {
    return { success: false, message: partnerResult.error, error: partnerResult.error };
  }
  if (!partnerResult.partner) {
    return { success: false, message: 'Parceiro não encontrado para o cupom fornecido.' };
  }

  if (partnerResult.partner.points < pointsToRedeem) {
    return { success: false, message: 'Pontos insuficientes para resgate.' };
  }

  const transactionData = {
    partnerId: partnerResult.partner.id,
    type: TransactionType.REDEMPTION,
    amount: pointsToRedeem,
    originalSaleValue: 0, // Redemptions don't have original sale value
    discountedValue: pointsToRedeem, // Example: 1 point = 1 unit of discount
    externalSaleId: undefined, // undefined to match type string | undefined
    date: new Date().toISOString(),
  };

  try {
    const { transaction, error } = await addTransaction(transactionData);
    if (error) throw new Error(error);
    return { success: true, message: 'Pontos resgatados com sucesso.' };
  } catch (err: any) {
    console.error('PocketBase redeemPoints error:', err);
    return { success: false, message: `Erro ao resgatar pontos: ${err.message} `, error: err.message };
  }
}

export async function deleteTransaction(transactionId: string): Promise<{ success: boolean; message: string; error?: string }> {
  try {
    const transaction = await pb.collection('transactions').getOne(transactionId);
    await pb.collection('transactions').delete(transactionId);

    // Revert partner points
    const partnerIdToUpdate = transaction.partner_id || transaction.partnerId;
    if (partnerIdToUpdate) {
      const partner = await pb.collection('partners').getOne(partnerIdToUpdate);
      let newPoints = partner.points || 0;

      if (transaction.type === TransactionType.SALE) {
        newPoints -= transaction.amount;
      } else if (transaction.type === TransactionType.REDEMPTION) {
        newPoints += transaction.amount;
      }

      await pb.collection('partners').update(partnerIdToUpdate, { points: newPoints });
    }

    return { success: true, message: 'Transação excluída com sucesso.' };
  } catch (err: any) {
    console.error('PocketBase deleteTransaction error:', err);
    return { success: false, message: `Erro ao excluir transação: ${err.message} `, error: err.message };
  }
}

export async function updateSaleTransaction(
  transactionId: string,
  newPartnerId: string,
  newTotalSaleValue: number,
  newExternalSaleId?: string,
  newSaleDate?: string
): Promise<{ success: boolean; message: string; error?: string }> {
  try {
    const oldTransaction = await pb.collection('transactions').getOne(transactionId);
    const oldPartnerId = oldTransaction.partner_id || oldTransaction.partnerId;
    const oldPartner = await pb.collection('partners').getOne(oldPartnerId);

    // Revert old points
    let oldPartnerNewPoints = oldPartner.points || 0;
    if (oldTransaction.type === TransactionType.SALE) {
      oldPartnerNewPoints -= oldTransaction.amount;
    }
    await pb.collection('partners').update(oldPartnerId, { points: oldPartnerNewPoints });

    // Calculate new points
    const newPointsGenerated = Math.floor(newTotalSaleValue / 10);
    const newPartner = await pb.collection('partners').getOne(newPartnerId);
    let newPartnerNewPoints = newPartner.points || 0;
    newPartnerNewPoints += newPointsGenerated;
    await pb.collection('partners').update(newPartnerId, { points: newPartnerNewPoints });

    await pb.collection('transactions').update(transactionId, {
      partner_id: newPartnerId,
      amount: newPointsGenerated
    });

    return { success: true, message: 'Transação de venda atualizada com sucesso.' };
  } catch (err: any) {
    console.error('PocketBase updateSaleTransaction error:', err);
    return { success: false, message: `Erro ao atualizar transação de venda: ${err.message} `, error: err.message };
  }
}

export async function updateRedemptionTransaction(
  transactionId: string,
  newPartnerId: string,
  newPointsToRedeem: number,
  newRedemptionDate?: string
): Promise<{ success: boolean; message: string; error?: string }> {
  try {
    const oldTransaction = await pb.collection('transactions').getOne(transactionId);
    const oldPartnerId = oldTransaction.partner_id || oldTransaction.partnerId;
    const oldPartner = await pb.collection('partners').getOne(oldPartnerId);

    // Revert old points
    let oldPartnerNewPoints = oldPartner.points || 0;
    if (oldTransaction.type === TransactionType.REDEMPTION) {
      oldPartnerNewPoints += oldTransaction.amount;
    }
    await pb.collection('partners').update(oldPartnerId, { points: oldPartnerNewPoints });

    // Apply new points
    const newPartner = await pb.collection('partners').getOne(newPartnerId);
    let newPartnerNewPoints = newPartner.points || 0;
    newPartnerNewPoints -= newPointsToRedeem;
    await pb.collection('partners').update(newPartnerId, { points: newPartnerNewPoints });

    // Update transaction
    await pb.collection('transactions').update(transactionId, {
      partner_id: newPartnerId,
      amount: newPointsToRedeem
    });

    return { success: true, message: 'Transação de resgate atualizada com sucesso.' };
  } catch (err: any) {
    console.error('PocketBase updateRedemptionTransaction error:', err);
    return { success: false, message: `Erro ao atualizar transação de resgate: ${err.message} `, error: err.message };
  }
}

export async function addTransaction(transactionData: Omit<Transaction, 'id' | 'date'> & { date?: string }) {
  try {
    const dataToSave = {
      partner_id: transactionData.partnerId,
      type: transactionData.type,
      amount: transactionData.amount
    };

    // Create transaction
    const record = await pb.collection('transactions').create(dataToSave);

    // Update partner points
    const partner = await pb.collection('partners').getOne(transactionData.partnerId);
    let newPoints = partner.points || 0;

    if (transactionData.type === TransactionType.SALE) {
      newPoints += transactionData.amount;
    } else if (transactionData.type === TransactionType.REDEMPTION) {
      newPoints -= transactionData.amount;
    }

    await pb.collection('partners').update(transactionData.partnerId, { points: newPoints });

    return { transaction: record as unknown as Transaction, error: null };
  } catch (err: any) {
    return { transaction: null, error: err.message || "Erro desconhecido" };
  }
}

export async function getAllTransactions() {
  try {
    const records = await pb.collection('transactions').getFullList({
      sort: '',
    });
    const mapped = records.map(r => ({ ...r, partnerId: r.partner_id, date: r.created ? r.created.replace(' ', 'T') : new Date().toISOString() }));
    mapped.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return { transactions: mapped as unknown as Transaction[], error: null };
  } catch (err: any) {
    return { transactions: [], error: err.message || "Erro desconhecido" };
  }
}

export async function getTransactionsByPartnerId(partnerId: string) {
  try {
    const records = await pb.collection('transactions').getFullList({
      filter: `partner_id = "${partnerId}"`,
      sort: '',
    });
    const mapped = records.map(r => ({ ...r, partnerId: r.partner_id, date: r.created ? r.created.replace(' ', 'T') : new Date().toISOString() }));
    mapped.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return { transactions: mapped as unknown as Transaction[], error: null };
  } catch (err: any) {
    return { transactions: [], error: err.message || "Erro desconhecido" };
  }
}

export async function getAllTransactionsWithPartnerDetails(): Promise<{ transactions?: Transaction[]; error?: string }> {
  try {
    const records = await pb.collection('transactions').getFullList({
      sort: '',
      expand: 'partner_id'
    });

    const mapped = records.map(record => ({
      id: record.id,
      partnerId: record.partner_id,
      type: record.type,
      amount: record.amount || 0,
      originalSaleValue: record.amount || 0,
      discountedValue: record.type === TransactionType.REDEMPTION ? record.amount : 0,
      externalSaleId: undefined,
      date: record.created ? record.created.replace(' ', 'T') : new Date().toISOString(),
      partnerName: record.expand?.partner_id?.name || 'Desconhecido',
      partnerCoupon: record.expand?.partner_id?.coupon || 'N/A'
    }));

    mapped.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return { transactions: mapped as Transaction[], error: undefined };
  } catch (err: any) {
    console.error("PocketBase getAllTransactionsWithPartnerDetails error:", err);
    return { transactions: undefined, error: err.message || "Erro desconhecido" };
  }
}

export async function getTransactionsForPartnerByDateRange(
  partnerId: string,
  startDateString?: string,
  endDateString?: string
): Promise<{ transactions?: Transaction[], error?: string }> {
  try {
    const filters: string[] = [`partner_id = "${partnerId}"`];

    if (startDateString) {
      filters.push(`created >= "${parseISO(startDateString).toISOString().replace('T', ' ')}"`);
    }
    if (endDateString) {
      filters.push(`created <= "${parseISO(endDateString).toISOString().replace('T', ' ')}"`);
    }

    const records = await pb.collection('transactions').getFullList({
      filter: filters.join(' && '),
      sort: '',
      expand: 'partner_id'
    });

    const mapped = records.map(record => ({
      id: record.id,
      partnerId: record.partner_id,
      type: record.type,
      amount: record.amount || 0,
      originalSaleValue: record.amount || 0,
      discountedValue: record.type === TransactionType.REDEMPTION ? record.amount : 0,
      externalSaleId: undefined,
      date: record.created ? record.created.replace(' ', 'T') : new Date().toISOString(),
      partnerName: record.expand?.partner_id?.name || 'Desconhecido',
      partnerCoupon: record.expand?.partner_id?.coupon || 'N/A'
    }));

    mapped.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return { transactions: mapped as Transaction[], error: undefined };
  } catch (err: any) {
    return { transactions: undefined, error: err.message || "Erro desconhecido" };
  }
}
