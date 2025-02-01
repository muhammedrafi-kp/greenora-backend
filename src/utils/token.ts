import jwt, { JwtPayload } from 'jsonwebtoken';
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
        console.log("decoded in util :",decoded)
        return decoded;
    } catch (err) {
        const error: any = new Error(MESSAGES.TOKEN_EXPIRED);
        error.status = HTTP_STATUS.UNAUTHORIZED;
        throw error;
    }
};
