import { IUser } from "../../models/User";

export class UserDto {
    public readonly _id: string;
    public readonly name: string;
    public readonly email: string;
    public readonly phone?: string;
    public readonly profileUrl?: string;
    public readonly authProvider: "google" | "local";

    constructor(user: IUser) {
        this._id = user._id.toString();
        this.name = user.name;
        this.email = user.email;
        this.phone = user.phone;
        this.profileUrl = user.profileUrl;
        this.authProvider = user.authProvider;
    }

    public static from(user: IUser): UserDto {
        return new UserDto(user);
    }

    public static fromList(users: IUser[]): UserDto[] {
        return users.map(user => new UserDto(user));
    }
}
