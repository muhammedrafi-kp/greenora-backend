import User, { IUser } from "../models/User";
import { IUserRepository } from "../interfaces/user/IUserRepository";
import { BaseRepository } from "./baseRepository";


class UserRepository extends BaseRepository<IUser> implements IUserRepository {
    constructor() {
        super(User);
    }
}

export default new UserRepository();