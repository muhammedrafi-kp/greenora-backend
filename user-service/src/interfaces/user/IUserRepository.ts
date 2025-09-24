import { IUser } from "../../models/User";
import { IBaseRepository } from "../baseRepository/IBaseRepository";

export interface IUserRepository extends IBaseRepository<IUser> {}