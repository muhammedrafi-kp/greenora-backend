import jwt, { JwtPayload } from 'jsonwebtoken';
import { OAuth2Client, TokenPayload } from 'google-auth-library';
import { MESSAGES } from '../constants/messages';
import { HTTP_STATUS } from '../constants/httpStatus';


export function generateToken(
    payload: object,
    secret: string,
    expiresIn: string
): string {
    return jwt.sign(payload, secret, { expiresIn });
}

export function generateAccessToken(userId: string, role: string): string {
    return generateToken({ userId, role }, process.env.JWT_ACCESS_SECRET as string, "1h");
}

export function generateRefreshToken(userId: string, role: string): string {
    return generateToken({ userId, role }, process.env.JWT_REFRESH_SECRET as string, "1d");
}

export function generateResetPasswordToken(userId: string): string {
    return generateToken({ userId }, process.env.JWT_RESET_PASSOWORD_SECRET as string, "1h");
}

export const decodeToken = (token: string): JwtPayload => {
    const decoded = jwt.decode(token) as JwtPayload;
    if (!decoded) {
        const error: any = new Error(MESSAGES.INVALID_TOKEN);
        error.status = HTTP_STATUS.UNAUTHORIZED;
        throw error;
    }
    return decoded;
};

export const verifyToken = (token: string, secret: string): JwtPayload => {
    try {
        const decoded = jwt.verify(token, secret) as JwtPayload;
        console.log("decoded in util :", decoded)
        return decoded;
    } catch (err) {
        const error: any = new Error(MESSAGES.TOKEN_EXPIRED);
        error.status = HTTP_STATUS.UNAUTHORIZED;
        throw error;
    }
};

export const verifyGoogleToken = async (token: string): Promise<TokenPayload | null> => {
    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID as string);
    try {
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID as string,
        });

        const payload = ticket.getPayload();
        if (!payload) throw new Error("Invalid Google token payload");

        return payload;
    } catch (error) {
        console.error('Error verifying Google token:', error);
        throw new Error("Invalid or expired Google token");
    }
}
