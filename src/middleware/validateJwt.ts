import { Request, Response, NextFunction } from "express";
import { HTTP_STATUS } from "../constants/httpStatus";
import { MESSAGES } from "../constants/messages";
import jwt, { JwtPayload } from "jsonwebtoken";
import { redis } from "../config/redisConfig";
import axios from "axios";

const excludedPaths = ['login', 'signup', 'verify-otp', 'resend-otp', 'refresh-token', 'callback', 'change-password', 'forget-password', 'reset-password'];

export const validateJwt = async (req: Request, res: Response, next: NextFunction) => {

    const lastPath = req.path.split('/').pop() as string;
    console.log("Last path :", lastPath);
    if (excludedPaths.includes(lastPath)) {
        return next();
    }

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET || "access_secret") as JwtPayload;
        console.log("decoded :", decoded);

        if (decoded.role === 'user' || decoded.role === 'collector') {
            console.log("entered in if");

            const isBlocked = await redis.get(`is-blocked:${decoded.userId}`);

            console.log("isBlocked :", isBlocked);

            if (isBlocked === "true") {
                console.log("entered in if2");
                return res.status(HTTP_STATUS.FORBIDDEN).json({
                    message: MESSAGES.USER_BLOCKED,
                    reason: "blocked"
                });
            }

            if (isBlocked === null) {
                console.log("isBlocked is null");
                const isBlocked = await refreshBlockedStatus(decoded.userId, decoded.role);

                if (isBlocked) {
                    return res.status(HTTP_STATUS.FORBIDDEN).json({
                        message: MESSAGES.USER_BLOCKED,
                        reason: "blocked"
                    });
                }
            }
        }

        req.headers['x-client-id'] = decoded.userId;
        req.headers['x-role'] = decoded.role;

        console.log("req.headers in validateJwt:", req.headers['x-client-id'], req.headers['x-role']);

        next();

    } catch (error: any) {
        console.log("Error while valdating token :", error.message);
        return res.status(401).json({ message: 'Forbidden: Invalid token' });
    }
}

const refreshBlockedStatus = async (userId: string, role: string) => {
    try {
        const response = await axios.get(`${process.env.USER_SERVICE_URL}/${role}/is-blocked/${userId}`);
        return response.data.isBlocked;
    } catch (error) {
        console.log("Error while refreshing user blocked status :", error);
        return null;
    }
}
