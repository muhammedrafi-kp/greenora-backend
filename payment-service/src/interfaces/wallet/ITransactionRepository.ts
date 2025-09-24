import { IBaseRepository } from "../baseRepository/IBaseRepository";
import { ITransaction } from "../../models/Transaction"

export interface ITransactionRepository extends IBaseRepository<ITransaction> { }