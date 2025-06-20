// src/lib/mock-data.ts
// This file simulates a server-side data store.
// In a real application, this would interact with a database.
import type { Partner, Transaction } from '@/types';
import { TransactionType } from '@/types';

// Ensure crypto.randomUUID is available (Node.js 16+)
const generateUUID = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Basic fallback for environments where crypto.randomUUID might not be available during generation time (though server actions should have it)
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};


let partners: Partner[] = [
  { id: generateUUID(), name: 'Loja Exemplo 1', coupon: 'PARCEIRO001', points: 225.50 },
  { id: generateUUID(), name: 'Influencer Fit', coupon: 'FITDESCONTO', points: 150.25 },
  { id: generateUUID(), name: 'Academia Power', coupon: 'POWERGYM', points: 450.75 },
];

let transactions: Transaction[] = [
  { id: generateUUID(), partnerId: partners[0].id, type: TransactionType.SALE, amount: 7.5, originalSaleValue: 100, discountedValue: 92.5, date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() },
  { id: generateUUID(), partnerId: partners[0].id, type: TransactionType.REDEMPTION, amount: 50, date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
  { id: generateUUID(), partnerId: partners[1].id, type: TransactionType.SALE, amount: 15.0, originalSaleValue: 200, discountedValue: 185, date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() },
  { id: generateUUID(), partnerId: partners[2].id, type: TransactionType.SALE, amount: 30.0, originalSaleValue: 400, discountedValue: 370, date: new Date().toISOString() },
];

export async function getPartners(): Promise<Partner[]> {
  return JSON.parse(JSON.stringify(partners)); // Deep copy
}

export async function getPartnerByCoupon(coupon: string): Promise<Partner | undefined> {
  const partner = partners.find(p => p.coupon.toUpperCase() === coupon.toUpperCase());
  return partner ? JSON.parse(JSON.stringify(partner)) : undefined;
}

export async function getPartnerById(id: string): Promise<Partner | undefined> {
  const partner = partners.find(p => p.id === id);
  return partner ? JSON.parse(JSON.stringify(partner)) : undefined;
}

export async function addPartner(name: string, coupon: string): Promise<{ success: boolean; message: string; partner?: Partner }> {
  if (partners.some(p => p.coupon.toUpperCase() === coupon.toUpperCase())) {
    return { success: false, message: 'Cupom já existe.' };
  }
  if (!name.trim() || !coupon.trim()) {
    return { success: false, message: 'Nome e cupom são obrigatórios.' };
  }
  const newPartner: Partner = {
    id: generateUUID(),
    name,
    coupon: coupon.toUpperCase(),
    points: 0,
  };
  partners.push(newPartner);
  return { success: true, message: 'Parceiro cadastrado com sucesso.', partner: JSON.parse(JSON.stringify(newPartner)) };
}

export async function registerSale(coupon: string, totalSaleValue: number): Promise<{ success: boolean; message: string; pointsGenerated?: number; discountedValue?: number }> {
  const partnerIndex = partners.findIndex(p => p.coupon.toUpperCase() === coupon.toUpperCase());
  if (partnerIndex === -1) {
    return { success: false, message: 'Cupom inválido.' };
  }
  if (isNaN(totalSaleValue) || totalSaleValue <= 0) {
    return { success: false, message: 'Valor da venda deve ser um número positivo.' };
  }

  const partner = partners[partnerIndex];
  const discount = totalSaleValue * 0.075;
  const pointsGenerated = parseFloat((totalSaleValue * 0.075).toFixed(2));
  const discountedValue = parseFloat((totalSaleValue - discount).toFixed(2));

  // Create a new partner object to avoid direct mutation issues with revalidation
  const updatedPartner = { ...partner, points: parseFloat((partner.points + pointsGenerated).toFixed(2)) };
  partners[partnerIndex] = updatedPartner;


  const newTransaction: Transaction = {
    id: generateUUID(),
    partnerId: partner.id,
    type: TransactionType.SALE,
    amount: pointsGenerated,
    originalSaleValue: totalSaleValue,
    discountedValue: discountedValue,
    date: new Date().toISOString(),
  };
  transactions.push(newTransaction);

  return { success: true, message: 'Venda registrada com sucesso.', pointsGenerated, discountedValue };
}

export async function redeemPoints(coupon: string, pointsToRedeem: number): Promise<{ success: boolean; message: string }> {
  const partnerIndex = partners.findIndex(p => p.coupon.toUpperCase() === coupon.toUpperCase());
  if (partnerIndex === -1) {
    return { success: false, message: 'Cupom inválido.' };
  }
  if (isNaN(pointsToRedeem) || pointsToRedeem <= 0) {
    return { success: false, message: 'Pontos a resgatar devem ser um número positivo.' };
  }
  
  const partner = partners[partnerIndex];
  pointsToRedeem = parseFloat(pointsToRedeem.toFixed(2));

  if (partner.points < pointsToRedeem) {
    return { success: false, message: 'Pontos insuficientes.' };
  }

  const updatedPartner = { ...partner, points: parseFloat((partner.points - pointsToRedeem).toFixed(2)) };
  partners[partnerIndex] = updatedPartner;

  const newTransaction: Transaction = {
    id: generateUUID(),
    partnerId: partner.id,
    type: TransactionType.REDEMPTION,
    amount: pointsToRedeem, // Stored as a positive value representing redeemed amount
    date: new Date().toISOString(),
  };
  transactions.push(newTransaction);

  return { success: true, message: 'Pontos resgatados com sucesso.' };
}

export async function getTransactionsForPartner(partnerId: string): Promise<Transaction[]> {
  const partner = await getPartnerById(partnerId);
  if (!partner) return [];
  
  return transactions
    .filter(t => t.partnerId === partnerId)
    .map(t => ({...t, partnerName: partner.name, partnerCoupon: partner.coupon }))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export async function getAllTransactionsWithPartnerDetails(): Promise<Transaction[]> {
  const populatedTransactions = await Promise.all(transactions.map(async (t) => {
    const partner = await getPartnerById(t.partnerId);
    return {
      ...t,
      partnerName: partner?.name || 'N/A',
      partnerCoupon: partner?.coupon || 'N/A',
    };
  }));
  return populatedTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}
