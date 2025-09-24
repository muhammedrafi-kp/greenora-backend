import { Request, Response, NextFunction } from "express";
import { HTTP_STATUS } from "../constants/httpStatus";
import { MESSAGES } from "../constants/messages";
import jwt, { JwtPayload } from "jsonwebtoken";
import { redis } from "../config/redisConfig";
import axios from "axios";

const EXCLUDED_PATHS = new Set([
    'login', 'signup', 'verify', 'resend', 'refresh-token',
    'callback', 'change-password', 'password-reset',
    'logout', 'health'
]);

export const validateToken = async (req: Request, res: Response, next: NextFunction) => {
    const path = req.path;
    const lastPath = path.split('/').pop() as string;

    console.log("Lat path :", lastPath);

    if (EXCLUDED_PATHS.has(lastPath) || path === "/socket/chat/") {
        return next();
    }

    const token = extractBearerToken(req.headers.authorization);
    if (!token) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({ message: MESSAGES.UNAUTHORIZED });
    }

    try {

        const decoded = verifyAccessToken(token);
        await checkBlockedStatus(decoded.userId, decoded.role);

        // Attach decoded info to headers
        req.headers['x-client-id'] = decoded.userId;
        req.headers['x-role'] = decoded.role;

        return next();
    } catch (error: any) {
        console.error("JWT validation error:", error.message);
        const status = error.status || HTTP_STATUS.UNAUTHORIZED;
        return res.status(status).json({ message: error.message || MESSAGES.UNAUTHORIZED });
    }
};


// Helpers

function extractBearerToken(authHeader?: string): string | null {
    return authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
}

function verifyAccessToken(token: string): JwtPayload {
    try {
        return jwt.verify(token, process.env.JWT_ACCESS_SECRET || "access_secret") as JwtPayload;
    } catch {
        throw { status: HTTP_STATUS.UNAUTHORIZED, message: MESSAGES.INVALID_TOKEN };
    }
}

async function checkBlockedStatus(userId: string, role: string): Promise<void> {
    if (role !== 'user' && role !== 'collector') return;

    const cacheKey = `is-blocked:${userId}`;
    let isBlocked = await redis.get(cacheKey);

    if (isBlocked === "true") {
        console.log("isblocked:", isBlocked);
        throw { status: HTTP_STATUS.FORBIDDEN, message: MESSAGES.USER_BLOCKED };
    }

    if (isBlocked === null) {
        isBlocked = await fetchBlockedStatus(userId, role);
        if (isBlocked === "true") {
            throw { status: HTTP_STATUS.FORBIDDEN, message: MESSAGES.USER_BLOCKED };
        }
    }
}

async function fetchBlockedStatus(userId: string, role: string): Promise<string> {
    try {
        const url = `${process.env.USER_SERVICE_URL}/${role}s/blocked-status/${userId}`;
        const response = await axios.get(url);
        console.log("response :", response.data)
        const isBlocked = response.data.isBlocked ? "true" : "false";
        await redis.set(`is-blocked:${userId}`, isBlocked, 'EX', 3600);
        return isBlocked;
    } catch (error) {
        console.error("Error while checking blocked status:", error);
        return "false";
    }
}
