import { Request, Response } from "express";
import { ILocationController } from "../interfaces/ILocationController";
import { ILocationService } from "../interfaces/ILocationService";
import { HTTP_STATUS } from "../constants/httpStatus";
import { MESSAGES } from "../constants/messages"

export class LocationController implements ILocationController {
    constructor(private locationService: ILocationService) {
        this.locationService = locationService;
    }

    async createDistrict(req: Request, res: Response): Promise<void> {
        try {
            const districtName = req.body.name;

            const district = await this.locationService.createDistrict(districtName);

            res.status(HTTP_STATUS.CREATED).json({
                success: true,
                message: MESSAGES.DISTRICT_CREATED,
                data: district
            });

        } catch (error: any) {
            console.error("Error during login:", error);
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    }

    async updateDistrict(req: Request, res: Response): Promise<void> {
        try {

            const { districtId } = req.params;
            const districtName = req.body.name;

            const updatedDistrict = await this.locationService.updateDistrict(districtId, districtName);

            console.log("updatedDistrict:", updatedDistrict);
            if (updatedDistrict) {
                res.status(HTTP_STATUS.OK).json({
                    success: true,
                    data: updatedDistrict
                });
            } else {
                res.status(HTTP_STATUS.NOT_FOUND).json({
                    success: false,
                    message: MESSAGES.CATEGORY_NOT_FOUND,
                });
            }

        } catch (error: any) {
            console.error("Error during updating district:", error);
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    }

    async deleteDistrict(req: Request, res: Response): Promise<void> {
        try {
            const { districtId } = req.params;
            const updatedDistrict = await this.locationService.deleteDistrict(districtId);

            if (updatedDistrict) {
                res.status(HTTP_STATUS.OK).json({
                    success: true
                });
            } else {
                res.status(HTTP_STATUS.BAD_REQUEST).json({
                    success: false,
                    message: MESSAGES.UNKNOWN_ERROR,
                });
            }
        } catch (error: any) {

            if (error.status === HTTP_STATUS.GONE) {
                res.status(HTTP_STATUS.GONE).json({
                    success: false,
                    message: error.message
                })
            };

            console.error("Error during login:", error);
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    }

   

    async getDistricts(req: Request, res: Response): Promise<void> {
        try {
            const districts = await this.locationService.findDistricts({isActive:true});

            res.status(HTTP_STATUS.OK).json({
                success: true,
                data: districts
            });

        } catch (error: any) {
            console.error("Error during login:", error);
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    }

    

    async getDistrictsWithServiceAreas(req: Request, res: Response): Promise<void> {
        try {
            const districtsAndServiceAreas = await this.locationService.getDistrictsWithServiceAreas();
            console.log(districtsAndServiceAreas);

            res.status(HTTP_STATUS.OK).json({
                success: true,
                data: districtsAndServiceAreas
            });

        } catch (error: any) {
            console.error("Error during login:", error);
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    }

    async createServiceArea(req: Request, res: Response): Promise<void> {
        try {
            const serviceAreaData = req.body;
            const serviceArea = await this.locationService.createServiceArea(serviceAreaData);
            res.status(HTTP_STATUS.CREATED).json({
                success: true,
                message: MESSAGES.SERVICE_AREA_CREATED,
                data: serviceArea
            });

        } catch (error: any) {
            console.error("Error during login:", error);
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    }

    async getServiceAreas(req: Request, res: Response): Promise<void> {
        try {
            const { districtId } = req.query;
            const serviceAreas = await this.locationService.findServiceAreas(districtId as string);
        } catch (error: any) {
            console.error("Error during login:", error);
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    }

    async updateServiceArea(req: Request, res: Response): Promise<void> {
        try {
            const { serviceAreaId } = req.params;
            
        } catch (error: any) {
            console.error("Error during login:", error);
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    }
}