import { Types } from 'mongoose';

export interface CreateTransactionDto {
  walletId:  Types.ObjectId; 
  type: 'debit' | 'credit' | 'refund';
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  serviceType: string;
  timestamp: Date;
}
