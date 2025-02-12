import { IAddress } from "../models/Address";
import { IBaseRepository } from "./IBaseRepository";
import { Types } from "mongoose";

export interface IAddressRepository extends IBaseRepository<IAddress>{
    getAddressesByUserId(userId: string):Promise<IAddress[]|null>;
}