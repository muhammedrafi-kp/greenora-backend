import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";

// declare global {
//     namespace Express {
//         interface Request {
//             user?: string | JwtPayload; // Add `user` property
//         }
//     }
// }

// interface CustomJwtPayload extends JwtPayload {
//     userId?: string;
// }

const excludedPaths = ['login', 'signup', 'verify-otp', 'resend-otp', 'google']; // Add other paths that don't need validation

export const validateToken = async (req: Request, res: Response, next: NextFunction) => {

    const lastPath = req.path.split('/').pop() as string;
    console.log("Last path :", lastPath);
    if (excludedPaths.includes(lastPath)) {
        return next(); // Skip token validation for excluded paths
    }

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET || "access_secret") as JwtPayload;
        console.log("decoded :", decoded);
        req.headers['x-user-id'] = decoded.userId;

        // console.log("req.headers in validatetoken:", req.headers);
        next();

    } catch (error: any) {
        console.log("Error in valdate Token :", error.message);
        return res.status(403).json({ message: 'Forbidden: Invalid token' });
    }
}