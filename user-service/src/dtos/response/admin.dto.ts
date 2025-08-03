import { IAdmin } from "../../models/Admin";

export class AdminDto {
  public readonly _id: string;
  public readonly email: string;

  constructor(admin: IAdmin) {
    this._id = admin._id.toString();
    this.email = admin.email;
  }

  public static from(admin: IAdmin): AdminDto {
    return new AdminDto(admin);
  }

  public static fromList(admins: IAdmin[]): AdminDto[] {
    return admins.map(AdminDto.from);
  }
}
