
// src/lib/mock-data.ts
// THIS FILE IS NOW BACKED BY FIREBASE/FIRESTORE.
// It is no longer "mock" data, but we keep the filename for simplicity.

import { db } from './firebase';
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

const FIREBASE_INIT_ERROR_MSG = "A conexão com o Firebase não foi inicializada.";

// Helper function to ensure Firestore is initialized before use.
const ensureDb = () => {
  if (!db) {
    throw new Error(
      FIREBASE_INIT_ERROR_MSG +
      " Verifique se as variáveis de ambiente do Firebase (NEXT_PUBLIC_FIREBASE_*) estão configuradas corretamente " +
      "no seu arquivo .env.local ou nas configurações de ambiente da sua plataforma de hospedagem (Vercel)."
    );
  }
  return db;
};

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

export async function getPartners(): Promise<Partner[]> {
  try {
    const partnersCollection = collection(ensureDb(), 'partners');
    const q = query(partnersCollection, orderBy('name', 'asc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(docToPartner);
  } catch (error) {
    if (error instanceof Error && error.message.startsWith(FIREBASE_INIT_ERROR_MSG)) {
      console.warn(error.message);
      return [];
    }
    throw error;
  }
}

export async function getPartnerByCoupon(coupon: string): Promise<Partner | undefined> {
   try {
    const partnersCollection = collection(ensureDb(), 'partners');
    const q = query(partnersCollection, where('coupon', '==', coupon.toUpperCase()));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
      return undefined;
    }
    return docToPartner(querySnapshot.docs[0]);
  } catch (error) {
    if (error instanceof Error && error.message.startsWith(FIREBASE_INIT_ERROR_MSG)) {
      console.warn(error.message);
      return undefined;
    }
    throw error;
  }
}

export async function getPartnerById(id: string): Promise<Partner | undefined> {
  try {
    const docRef = doc(ensureDb(), 'partners', id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      return undefined;
    }
    return docToPartner(docSnap);
  } catch (error) {
    if (error instanceof Error && error.message.startsWith(FIREBASE_INIT_ERROR_MSG)) {
      console.warn(error.message);
      return undefined;
    }
    throw error;
  }
}

export async function addPartner(name: string, coupon: string): Promise<{ success: boolean; message: string; partner?: Partner }> {
  const existingPartner = await getPartnerByCoupon(coupon);
  if (existingPartner) {
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

  const partnersCollection = collection(ensureDb(), 'partners');
  const docRef = await addDoc(partnersCollection, newPartnerData);
  const newPartner = await getPartnerById(docRef.id);
  
  return { success: true, message: 'Parceiro cadastrado com sucesso.', partner: newPartner! };
}

export async function registerSale(
  coupon: string, 
  totalSaleValue: number,
  externalSaleId?: string
): Promise<{ success: boolean; message: string; pointsGenerated?: number; discountedValue?: number }> {
  const partner = await getPartnerByCoupon(coupon);
  if (!partner) {
    return { success: false, message: 'Cupom inválido.' };
  }
  if (isNaN(totalSaleValue) || totalSaleValue <= 0) {
    return { success: false, message: 'Valor da venda deve ser um número positivo.' };
  }

  const discount = totalSaleValue * 0.075;
  const pointsGenerated = parseFloat((totalSaleValue * 0.075).toFixed(2));
  const discountedValue = parseFloat((totalSaleValue - discount).toFixed(2));

  const partnerRef = doc(ensureDb(), 'partners', partner.id);
  const localDb = ensureDb();

  try {
    await runTransaction(localDb, async (transaction) => {
      const partnerDoc = await transaction.get(partnerRef);
      if (!partnerDoc.exists()) {
        throw new Error("Parceiro não encontrado.");
      }

      const currentPoints = partnerDoc.data().points || 0;
      const newPoints = parseFloat((currentPoints + pointsGenerated).toFixed(2));
      transaction.update(partnerRef, { points: newPoints });

      const transactionsCollection = collection(localDb, 'transactions');
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
  } catch (e) {
    console.error("Transaction failed: ", e);
    return { success: false, message: 'Ocorreu um erro ao registrar a venda.' };
  }
}

export async function redeemPoints(coupon: string, pointsToRedeem: number): Promise<{ success: boolean; message: string }> {
  const partner = await getPartnerByCoupon(coupon);
  if (!partner) {
    return { success: false, message: 'Cupom inválido.' };
  }
  if (isNaN(pointsToRedeem) || pointsToRedeem <= 0) {
    return { success: false, message: 'Pontos a resgatar devem ser um número positivo.' };
  }
  
  pointsToRedeem = parseFloat(pointsToRedeem.toFixed(2));

  const partnerRef = doc(ensureDb(), 'partners', partner.id);
  const localDb = ensureDb();

  try {
    await runTransaction(localDb, async (transaction) => {
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

      const transactionsCollection = collection(localDb, 'transactions');
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
    if (e.message.includes("Pontos insuficientes")) {
         return { success: false, message: 'Pontos insuficientes.' };
    }
    return { success: false, message: 'Ocorreu um erro ao resgatar os pontos.' };
  }
}

export async function getTransactionsForPartner(partnerId: string): Promise<Transaction[]> {
   try {
    const transactionsCollection = collection(ensureDb(), 'transactions');
    const q = query(
      transactionsCollection, 
      where('partnerId', '==', partnerId),
      orderBy('date', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(docToTransaction);
  } catch (error) {
    if (error instanceof Error && error.message.startsWith(FIREBASE_INIT_ERROR_MSG)) {
      console.warn(error.message);
      return [];
    }
    throw error;
  }
}

export async function getAllTransactionsWithPartnerDetails(): Promise<Transaction[]> {
   try {
    const transactionsCollection = collection(ensureDb(), 'transactions');
    const q = query(transactionsCollection, orderBy('date', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(docToTransaction);
  } catch (error) {
    if (error instanceof Error && error.message.startsWith(FIREBASE_INIT_ERROR_MSG)) {
      console.warn(error.message);
      return [];
    }
    throw error;
  }
}

export async function getTransactionsForPartnerByDateRange(
  partnerId: string,
  startDateString?: string,
  endDateString?: string
): Promise<Transaction[]> {
    try {
      const transactionsCollection = collection(ensureDb(), 'transactions');
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
      return querySnapshot.docs.map(docToTransaction);
    } catch (error) {
      if (error instanceof Error && error.message.startsWith(FIREBASE_INIT_ERROR_MSG)) {
        console.warn(error.message);
        return [];
      }
      throw error;
    }
}
