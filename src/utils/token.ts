import jwt, { JwtPayload } from 'jsonwebtoken';
import { OAuth2Client, TokenPayload } from 'google-auth-library';
import { MESSAGES } from '../constants/messages';
import { HTTP_STATUS } from '../constants/httpStatus';

export function generateAccessToken(userId: string, role: string): string {
    return jwt.sign(
        { userId, role },
        process.env.JWT_ACCESS_SECRET as string,
        { expiresIn: '15m' }
    );
}

export function generateRefreshToken(userId: string, role: string): string {
    return jwt.sign(
        { userId, role },
        process.env.JWT_REFRESH_SECRET as string,
        { expiresIn: '1d' }
    );
}

export const verifyToken = (token: string): JwtPayload => {
    try {
        const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET as string) as JwtPayload;
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
