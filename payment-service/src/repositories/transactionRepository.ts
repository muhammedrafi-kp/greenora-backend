import { BaseRepository } from "./baseRepository";
import { Transaction, ITransaction } from "../models/Transaction";
import { ITransactionRepository } from "../interfaces/wallet/ITransactionRepository";

class TransactionRepository extends BaseRepository<ITransaction> implements ITransactionRepository {
    constructor() {
        super(Transaction);
    }
}

export default new TransactionRepository();