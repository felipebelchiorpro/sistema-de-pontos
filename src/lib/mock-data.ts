// src/lib/mock-data.ts
// THIS FILE IS NOW BACKED BY FIREBASE/FIRESTORE.
// It is no longer "mock" data, but we keep the filename for simplicity.

import { getDb } from './firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  getDoc, 
  addDoc, 
  runTransaction, 
  orderBy, 
  Timestamp,
} from 'firebase/firestore';
import type { Partner, Transaction } from '@/types';
import { TransactionType } from '@/types';
import { parseISO } from 'date-fns';

// Helper to convert Firestore doc to Partner object
const docToPartner = (docSnap: any): Partner => {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    name: data.name || '',
    coupon: data.coupon || '',
    points: data.points || 0,
  };
};

// Helper to convert Firestore doc to Transaction object
const docToTransaction = (docSnap: any): Transaction => {
  const data = docSnap.data();
  // Firestore timestamps need to be converted to JS Date objects then to ISO strings
  const date = data.date instanceof Timestamp ? data.date.toDate().toISOString() : new Date().toISOString();
  return {
    id: docSnap.id,
    partnerId: data.partnerId,
    partnerName: data.partnerName,
    partnerCoupon: data.partnerCoupon,
    type: data.type,
    amount: data.amount,
    originalSaleValue: data.originalSaleValue,
    discountedValue: data.discountedValue,
    externalSaleId: data.externalSaleId,
    date: date,
  };
};

export async function getPartners(): Promise<{ partners?: Partner[]; error?: string }> {
  const { db, error } = getDb();
  if (error) return { error };

  const partnersCollection = collection(db, 'partners_v2');
  const q = query(partnersCollection, orderBy('name', 'asc'));
  const querySnapshot = await getDocs(q);
  return { partners: querySnapshot.docs.map(docToPartner) };
}

export async function getPartnerByCoupon(coupon: string): Promise<{ partner?: Partner; error?: string }> {
  const { db, error } = getDb();
  if (error) return { error };

  const partnersCollection = collection(db, 'partners_v2');
  const q = query(partnersCollection, where('coupon', '==', coupon.toUpperCase()));
  const querySnapshot = await getDocs(q);
  if (querySnapshot.empty) {
    return { partner: undefined };
  }
  return { partner: docToPartner(querySnapshot.docs[0]) };
}

export async function getPartnerById(id: string): Promise<{ partner?: Partner; error?: string }> {
  const { db, error } = getDb();
  if (error) return { error };
  
  const docRef = doc(db, 'partners_v2', id);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) {
    return { partner: undefined };
  }
  return { partner: docToPartner(docSnap) };
}

export async function addPartner(name: string, coupon: string): Promise<{ success: boolean; message: string; partner?: Partner, error?: string }> {
  const { db, error } = getDb();
  if (error) return { success: false, message: "Erro de configuração do DB", error };

  const existingPartnerResult = await getPartnerByCoupon(coupon);
  if (existingPartnerResult.error) return { success: false, message: existingPartnerResult.error, error: existingPartnerResult.error };
  if (existingPartnerResult.partner) {
    return { success: false, message: 'Cupom já existe.' };
  }
  if (!name.trim() || !coupon.trim()) {
    return { success: false, message: 'Nome e cupom são obrigatórios.' };
  }

  const newPartnerData = {
    name,
    coupon: coupon.toUpperCase(),
    points: 0,
  };

  const partnersCollection = collection(db, 'partners_v2');
  const docRef = await addDoc(partnersCollection, newPartnerData);
  const newPartnerResult = await getPartnerById(docRef.id);
  if (newPartnerResult.error) return { success: false, message: newPartnerResult.error, error: newPartnerResult.error };
  
  return { success: true, message: 'Parceiro cadastrado com sucesso.', partner: newPartnerResult.partner! };
}

export async function registerSale(
  coupon: string, 
  totalSaleValue: number,
  externalSaleId?: string
): Promise<{ success: boolean; message: string; pointsGenerated?: number; discountedValue?: number; error?: string }> {
  const { db, error } = getDb();
  if (error) return { success: false, message: "Erro de configuração do DB", error };

  const partnerResult = await getPartnerByCoupon(coupon);
  if (partnerResult.error) return { success: false, message: partnerResult.error, error: partnerResult.error };
  if (!partnerResult.partner) {
    return { success: false, message: 'Cupom inválido.' };
  }
  if (isNaN(totalSaleValue) || totalSaleValue <= 0) {
    return { success: false, message: 'Valor da venda deve ser um número positivo.' };
  }

  const partner = partnerResult.partner;
  const discount = totalSaleValue * 0.075;
  const pointsGenerated = parseFloat((totalSaleValue * 0.075).toFixed(2));
  const discountedValue = parseFloat((totalSaleValue - discount).toFixed(2));

  const partnerRef = doc(db, 'partners_v2', partner.id);
  
  try {
    await runTransaction(db, async (transaction) => {
      const partnerDoc = await transaction.get(partnerRef);
      if (!partnerDoc.exists()) {
        throw new Error("Parceiro não encontrado.");
      }

      const currentPoints = partnerDoc.data().points || 0;
      const newPoints = parseFloat((currentPoints + pointsGenerated).toFixed(2));
      transaction.update(partnerRef, { points: newPoints });

      const transactionsCollection = collection(db, 'transactions_v2');
      const newTransactionData = {
        partnerId: partner.id,
        type: TransactionType.SALE,
        amount: pointsGenerated,
        originalSaleValue: totalSaleValue,
        discountedValue: discountedValue,
        externalSaleId: externalSaleId || null,
        date: Timestamp.now(),
        partnerName: partner.name,
        partnerCoupon: partner.coupon,
      };
      transaction.set(doc(transactionsCollection), newTransactionData);
    });
    return { success: true, message: 'Venda registrada com sucesso.', pointsGenerated, discountedValue };
  } catch (e: any) {
    console.error("Transaction failed: ", e);
    const errorMsg = e.message || 'Ocorreu um erro ao registrar a venda.';
    return { success: false, message: errorMsg, error: errorMsg };
  }
}

export async function redeemPoints(coupon: string, pointsToRedeem: number): Promise<{ success: boolean; message: string; error?: string }> {
  const { db, error } = getDb();
  if (error) return { success: false, message: "Erro de configuração do DB", error };

  const partnerResult = await getPartnerByCoupon(coupon);
  if (partnerResult.error) return { success: false, message: partnerResult.error, error: partnerResult.error };
  if (!partnerResult.partner) {
    return { success: false, message: 'Cupom inválido.' };
  }
  if (isNaN(pointsToRedeem) || pointsToRedeem <= 0) {
    return { success: false, message: 'Pontos a resgatar devem ser um número positivo.' };
  }
  
  const partner = partnerResult.partner;
  pointsToRedeem = parseFloat(pointsToRedeem.toFixed(2));
  const partnerRef = doc(db, 'partners_v2', partner.id);

  try {
    await runTransaction(db, async (transaction) => {
      const partnerDoc = await transaction.get(partnerRef);
      if (!partnerDoc.exists()) {
        throw new Error("Parceiro não encontrado.");
      }

      const currentPoints = partnerDoc.data().points || 0;
      if (currentPoints < pointsToRedeem) {
        throw new Error("Pontos insuficientes.");
      }
      
      const newPoints = parseFloat((currentPoints - pointsToRedeem).toFixed(2));
      transaction.update(partnerRef, { points: newPoints });

      const transactionsCollection = collection(db, 'transactions_v2');
      const newTransactionData = {
        partnerId: partner.id,
        type: TransactionType.REDEMPTION,
        amount: pointsToRedeem,
        date: Timestamp.now(),
        partnerName: partner.name,
        partnerCoupon: partner.coupon,
      };
      transaction.set(doc(transactionsCollection), newTransactionData);
    });
     return { success: true, message: 'Pontos resgatados com sucesso.' };
  } catch (e: any) {
    console.error("Transaction failed: ", e.message);
    const errorMsg = e.message.includes("Pontos insuficientes") ? e.message : 'Ocorreu um erro ao resgatar os pontos.';
    return { success: false, message: errorMsg, error: errorMsg };
  }
}

export async function getAllTransactionsWithPartnerDetails(): Promise<{ transactions?: Transaction[]; error?: string }> {
  const { db, error } = getDb();
  if (error) return { error };

  const transactionsCollection = collection(db, 'transactions_v2');
  const q = query(transactionsCollection, orderBy('date', 'desc'));
  const querySnapshot = await getDocs(q);
  return { transactions: querySnapshot.docs.map(docToTransaction) };
}

export async function getTransactionsForPartnerByDateRange(
  partnerId: string,
  startDateString?: string,
  endDateString?: string
): Promise<{ transactions?: Transaction[], error?: string }> {
  const { db, error } = getDb();
  if (error) return { error };

  const transactionsCollection = collection(db, 'transactions_v2');
  let constraints = [where('partnerId', '==', partnerId)];

  if (startDateString) {
    constraints.push(where('date', '>=', Timestamp.fromDate(parseISO(startDateString))));
  }
  if (endDateString) {
    constraints.push(where('date', '<=', Timestamp.fromDate(parseISO(endDateString))));
  }

  const q = query(
    transactionsCollection, 
    ...constraints,
    orderBy('date', 'desc')
  );
  
  const querySnapshot = await getDocs(q);
  return { transactions: querySnapshot.docs.map(docToTransaction) };
}