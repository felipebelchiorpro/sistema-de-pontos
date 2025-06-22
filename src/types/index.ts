export interface Partner {
  id: string; // UUID
  name: string;
  coupon: string; // Unique
  points: number;
}

export enum TransactionType {
  SALE = 'Venda',
  REDEMPTION = 'Resgate',
}

export interface Transaction {
  id: string; // UUID
  partnerId: string;
  partnerName?: string; // For display purposes, added by getAllTransactionsWithPartnerDetails or getTransactionsForPartner
  partnerCoupon?: string; // For display purposes, added by getAllTransactionsWith-PartnerDetails or getTransactionsForPartner
  type: TransactionType;
  amount: number; // For sales, this is points_generated. For redemptions, points_subtracted (positive value)
  originalSaleValue?: number; // Only for sales
  discountedValue?: number; // Only for sales
  externalSaleId?: string; // ID from external system, only for sales
  date: string; // ISO string
}
