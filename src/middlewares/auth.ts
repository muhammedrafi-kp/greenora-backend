import { Request, Response, NextFunction } from 'express';
import { HTTP_STATUS } from '../constants/httpStatus';
import { MESSAGES } from '../constants/messages';

export const validateUser = (req: Request, res: Response, next: NextFunction): void => {
    const userId = req.headers['x-user-id'];
    const role = req.headers['x-role'];
    if (!userId || role !== 'user') {
        res.status(HTTP_STATUS.FORBIDDEN).json({ message: MESSAGES.ACCESS_DENIED });
        return;
    }
    next();
};

export const validateAdmin = (req: Request, res: Response, next: NextFunction): void => {
    const userId = req.headers['x-user-id'];
    const role = req.headers['x-role'];
    if (!userId || role !== 'admin') {
        res.status(HTTP_STATUS.FORBIDDEN).json({ message: MESSAGES.ACCESS_DENIED });
        return;
    }

    next();
};

export const validateCollector = (req: Request, res: Response, next: NextFunction): void => {
    const userId = req.headers['x-user-id'];
    const role = req.headers['x-role'];
    if (!userId || role !== 'collector') {
        res.status(HTTP_STATUS.FORBIDDEN).json({ message: MESSAGES.ACCESS_DENIED });
        return;
    }

    next();
};

