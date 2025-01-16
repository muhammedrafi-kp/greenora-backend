import jwt from 'jsonwebtoken';

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'access_secret';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'refresh_secret';

export function generateAccessToken(userId: string): string {
    return jwt.sign(
        { userId }, 
        JWT_ACCESS_SECRET, 
        { expiresIn: '30m' }  
    );
}

export function generateRefreshToken(userId: string): string {
    return jwt.sign(
        { userId }, 
        JWT_REFRESH_SECRET, 
        { expiresIn: '10s' }  
    );
}
