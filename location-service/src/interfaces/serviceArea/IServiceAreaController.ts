import { Request, Response } from "express";

export interface IServiceAreaController {
    createDistrict(req: Request, res: Response): Promise<void>;
    getDistricts(req: Request, res: Response): Promise<void>;
    getDistrictsWithServiceAreas(req: Request, res: Response): Promise<void>;
    updateDistrict(req: Request, res: Response): Promise<void>;
    deleteDistrict(req: Request, res: Response): Promise<void>;
    createServiceArea(req: Request, res: Response): Promise<void>;
    getServiceAreasByDistrict(req: Request, res: Response): Promise<void>;
    updateServiceArea(req: Request, res: Response): Promise<void>;
    isServiceAvailable(req: Request, res: Response): Promise<void>;
    getDistrictWithServiceArea(req: Request, res: Response): Promise<void>;
    getDistrictsByIds(req: Request, res: Response): Promise<void>;
    getServiceAreasByIds(req: Request, res: Response): Promise<void>;
}