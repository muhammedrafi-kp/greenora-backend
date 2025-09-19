import { IsEnum, IsMongoId, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateTransactionDto {
  @IsMongoId()
  walletId!: string; 

  @IsEnum(["debit", "credit", "refund"])
  type!: "debit" | "credit" | "refund";

  @IsNumber()
  amount!: number;

  @IsEnum(["pending", "completed", "failed"])
  @IsOptional()
  status?: "pending" | "completed" | "failed"; 

  @IsString()
  serviceType!: string;
}
