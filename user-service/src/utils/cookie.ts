import { Response } from 'express';

export function setRefreshTokenCookie(res: Response, refreshToken: string): void {
    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'none', // change to 'lax' if you're not doing cross-site
        maxAge: 24 * 60 * 60 * 1000,
    });
}

export function clearRefreshTokenCookie(res: Response): void {
    res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
    });
}