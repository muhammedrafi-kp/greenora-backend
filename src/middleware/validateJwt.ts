import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";

const excludedPaths = ['login', 'signup', 'verify-otp', 'resend-otp', 'refresh-token', 'google'];

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
        req.headers['x-user-id'] = decoded.userId;
        req.headers['x-role'] = decoded.role;

        console.log("req.headers in validatetoken:", req.headers);
        next();

    } catch (error: any) {
        console.log("Error while valdating token :", error.message);
        return res.status(401).json({ message: 'Forbidden: Invalid token' });
    }
}