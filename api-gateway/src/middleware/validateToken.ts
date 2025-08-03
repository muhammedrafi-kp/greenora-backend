// import { Request, Response, NextFunction } from "express";
// import { HTTP_STATUS } from "../constants/httpStatus";
// import { MESSAGES } from "../constants/messages";
// import jwt, { JwtPayload } from "jsonwebtoken";
// import { redis } from "../config/redisConfig";
// import axios from "axios";

// const excludedPaths = [
//     'login', 'signup', 'verify-otp', 'resend-otp', 'refresh-token',
//     'callback', 'change-password', 'forget-password', 'reset-password',
// ];

// export const validateJwt = async (req: Request, res: Response, next: NextFunction) => {

//     const path = req.path;
//     const lastPath = req.path.split('/').pop() as string;

//     console.log("Incoming path:", path);
//     console.log("Last path :", lastPath);

//     if (excludedPaths.includes(lastPath) || path == "/socket/chat/") {
//         return next();
//     }

//     const authHeader = req.headers.authorization;

//     if (!authHeader || !authHeader.startsWith('Bearer ')) {
//         return res.status(401).json({ message: 'Unauthorized' });
//     }

//     const token = authHeader.split(' ')[1];

//     try {
//         const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET || "access_secret") as JwtPayload;

//         console.log("decoded :", decoded);

//         if (decoded.role === 'user' || decoded.role === 'collector') {

//             const isBlocked = await redis.get(`is-blocked:${decoded.userId}`);

//             console.log("isBlocked :", isBlocked);

//             if (isBlocked === "true") {
//                 return res.status(HTTP_STATUS.FORBIDDEN).json({
//                     message: MESSAGES.USER_BLOCKED,
//                     reason: "blocked"
//                 });
//             }

//             if (isBlocked === null) {
//                 const isBlocked = await refreshBlockedStatus(decoded.userId, decoded.role);
//                 console.log("isblocked from db:", isBlocked);
//                 if (isBlocked) {
//                     return res.status(HTTP_STATUS.FORBIDDEN).json({
//                         message: MESSAGES.USER_BLOCKED,
//                         reason: "blocked"
//                     });
//                 }
//             }
//         }

//         req.headers['x-client-id'] = decoded.userId;
//         req.headers['x-role'] = decoded.role;

//         console.log("req.headers in validateJwt:", req.headers['x-client-id'], req.headers['x-role']);

//         next();

//     } catch (error: any) {
//         console.log("Error while valdating token :", error.message);
//         return res.status(401).json({ message: 'Forbidden: Invalid token' });
//     }
// }

// const refreshBlockedStatus = async (userId: string, role: string) => {
//     try {
//         const response = await axios.get(`${process.env.USER_SERVICE_URL}/${role}/is-blocked/${userId}`);
//         const isBlocked = response.data.isBlocked
//         await redis.set(`is-blocked:${userId}`, isBlocked, 'EX', 3600);

//         return isBlocked;
//     } catch (error) {
//         console.log("Error while refreshing user blocked status :", error);
//         return null;
//     }
// }


import { Request, Response, NextFunction } from "express";
import { HTTP_STATUS } from "../constants/httpStatus";
import { MESSAGES } from "../constants/messages";
import jwt, { JwtPayload } from "jsonwebtoken";
import { redis } from "../config/redisConfig";
import axios from "axios";

const EXCLUDED_PATHS = new Set([
    'login', 'signup', 'verify-otp', 'resend-otp', 'refresh-token',
    'callback', 'change-password', 'forget-password', 'reset-password',
    'logout',
]);

export const validateToken = async (req: Request, res: Response, next: NextFunction) => {
    const path = req.path;
    const lastPath = path.split('/').pop() as string;

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
        throw { status: HTTP_STATUS.UNAUTHORIZED, message:  MESSAGES.INVALID_TOKEN };
    }
}

async function checkBlockedStatus(userId: string, role: string): Promise<void> {
    if (role !== 'user' && role !== 'collector') return;

    const cacheKey = `is-blocked:${userId}`;
    let isBlocked = await redis.get(cacheKey);

    if (isBlocked === "true") {
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
        const url = `${process.env.USER_SERVICE_URL}/${role}/blocked-status/${userId}`;
        const response = await axios.get(url);
        const isBlocked = response.data.isBlocked ? "true" : "false";
        await redis.set(`is-blocked:${userId}`, isBlocked, 'EX', 3600);
        return isBlocked;
    } catch (error) {
        console.error("Error while checking blocked status:", error);
        return "false";
    }
}
