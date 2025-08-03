import { IsEmail, IsNotEmpty,IsString, Matches, MinLength } from "class-validator";

export class LoginDto {
    @IsEmail({}, { message: 'Invalid email format.' })
    @IsNotEmpty({ message: 'Email is required.' })
    email!: string;

    @IsNotEmpty({ message: 'Password is required.' })
    @MinLength(8, { message: 'Password must be at least 8 characters long.' })
    @Matches(/^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/, {
        message:
            'Password must contain at least 1 letter, 1 number, and 1 special character.',
    })
    password!: string;
}

export class SignupDto {
    @IsNotEmpty({ message: 'Username is required.' })
    @Matches(/^(?!_+$)[a-zA-Z0-9_]{3,20}$/, {
        message: 'Username cannot be only underscores and must be 3–20 characters long with letters, numbers, or underscores.',
    })
    name!: string;

    @IsEmail({}, { message: 'Invalid email format.' })
    @IsNotEmpty({ message: 'Email is required.' })
    email!: string;

    @IsNotEmpty({ message: 'Password is required.' })
    @MinLength(8, { message: 'Password must be at least 8 characters long.' })
    @Matches(/^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/, {
        message:
            'Password must contain at least 1 letter, 1 number, and 1 special character.',
    })
    password!: string;

    @IsNotEmpty({ message: 'Phone number is required.' })
    @Matches(/^[6-9]\d{9}$/, {
        message: 'Phone number must start with 6–9 and contain exactly 10 digits.',
    })
    phone!: string;
}

export class VerifyOtpDto {
    @IsEmail({}, { message: 'Invalid email format.' })
    @IsNotEmpty({ message: 'Email is required.' })
    email!: string;

    @IsNotEmpty({ message: 'OTP is required.' })
    @Matches(/^\d{4}$/, { message: 'OTP must be exactly 4 digits.' })
    otp!: string;
}

export class ResendOtpDto {
    @IsEmail({}, { message: 'Invalid email format.' })
    @IsNotEmpty({ message: 'Email is required.' })
    email!: string;
}

export class ResetPasswordDto {
    @IsNotEmpty({ message: "Reset token is required." })
    token!: string;

    @IsNotEmpty({ message: "Password is required." })
    @MinLength(8, { message: "Password must be at least 8 characters long." })
    @Matches(
        /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/,
        {
            message:
                "Password must contain at least 1 letter, 1 number, and 1 special character.",
        }
    )
    password!: string;
}

export class SendResetPasswordLinkDto {
    @IsEmail({}, { message: 'Invalid email format.' })
    @IsNotEmpty({ message: 'Email is required.' })
    email!: string;
}

export class GoogleAuthCallbackDto {
    @IsNotEmpty({ message: 'Credential is required.' })
    @IsString({ message: 'Credential must be a string.' })
    credential!: string;
}