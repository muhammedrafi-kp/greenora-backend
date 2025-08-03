import { IUser } from "../../models/User";
import { ICollector } from "../../models/Collector";
import { IAdmin } from "../../models/Admin";

type User = IUser | ICollector | IAdmin;

export class AuthDTo {
    public readonly _id: string;
    public readonly name: string;
    public readonly email: string;

    constructor(user: any) {
        this._id = user._id.toString();
        this.name = user.name;
        this.email = user.email;
    }

    public static from(user: User): AuthDTo {
        return new AuthDTo(user);
    }
}