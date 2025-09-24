import { IUser } from "../../models/User";

export class UserDto {
    public readonly _id: string;
    public readonly name: string;
    public readonly email: string;
    public readonly phone?: string;
    public readonly profileUrl?: string;
    public readonly authProvider: "google" | "local";
    public readonly isBlocked:boolean;

    constructor(user: IUser) {
        this._id = user._id.toString();
        this.name = user.name;
        this.email = user.email;
        this.phone = user.phone;
        this.profileUrl = user.profileUrl;
        this.authProvider = user.authProvider;
        this.isBlocked = user.isBlocked;
    }

    public static from(user: IUser): UserDto {
        return new UserDto(user);
    }

    public static fromList(users: IUser[]): UserDto[] {
        return users.map(user => new UserDto(user));
    }
}
