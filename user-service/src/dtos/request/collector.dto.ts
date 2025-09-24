export class UpdateCollectorDto {
  name?: string;
  phone?: string;
  gender?: "male" | "female";
  district?: string;
  serviceArea?: string;
  profileUrl?: string;
  idProofType?: string;
  idProofFrontUrl?: string;
  idProofBackUrl?: string;
  verificationStatus?: "pending" | "requested" | "approved" | "rejected";
  isVerified?: boolean;
  editAccess?: boolean; 
  isBlocked?: boolean; 
}
