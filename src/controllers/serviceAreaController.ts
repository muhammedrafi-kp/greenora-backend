import { Request, Response } from "express";
import { IServiceAreaController } from "../interfaces/IServiceAreaController";
import { IServiceAreaService } from "../interfaces/IServiceAreaService";
import { HTTP_STATUS } from "../constants/httpStatus";
import { MESSAGES } from "../constants/messages"

export class ServiceAreaController implements IServiceAreaController {
    constructor(private serviceAreaService: IServiceAreaService) {
        this.serviceAreaService = serviceAreaService;
    }

    async createDistrict(req: Request, res: Response): Promise<void> {
        try {
            const districtName = req.body.name;

            const district = await this.serviceAreaService.createDistrict(districtName);

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

            const updatedDistrict = await this.serviceAreaService.updateDistrict(districtId, districtName);

            console.log("updatedDistrict:", updatedDistrict);
            if (updatedDistrict) {
                res.status(HTTP_STATUS.OK).json({
                    success: true,
                    data: updatedDistrict
                });
            } else {
                res.status(HTTP_STATUS.NOT_FOUND).json({
                    success: false,
                    message: MESSAGES.DISTRICT_NOT_FOUND,
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
            const updatedDistrict = await this.serviceAreaService.deleteDistrict(districtId);

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

            const query: any = { isActive: true };
            const districts = await this.serviceAreaService.getDistricts(query);

            if (!districts) {
                res.status(HTTP_STATUS.NOT_FOUND).json({
                    success: true,
                    message: MESSAGES.DISTRICTS_NOT_FOUND
                });
                return;
            }

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
            const districtsAndServiceAreas = await this.serviceAreaService.getDistrictsWithServiceAreas();
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
            const serviceArea = await this.serviceAreaService.createServiceArea(serviceAreaData);
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
            const { districtId } = req.params;
            const serviceAreas = await this.serviceAreaService.getServiceAreas(districtId as string);

            if (!serviceAreas) {
                res.status(HTTP_STATUS.NOT_FOUND).json({
                    success: true,
                    message: MESSAGES.SERVICE_AREAS_NOT_FOUND
                });
                return;
            }

            res.status(HTTP_STATUS.OK).json({
                success: true,
                data: serviceAreas
            });

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

    async isServiceAvailable(req: Request, res: Response): Promise<void> {
        try {
            const { serviceAreaId, pinCode } = req.body;
            console.log("serviceAreaId :", serviceAreaId)
            console.log("pinCode :", pinCode)

            const serviceArea = await this.serviceAreaService.isServiceAvailable(serviceAreaId, pinCode);

            if (!serviceArea) {
                res.status(HTTP_STATUS.BAD_REQUEST).json({
                    success: false,
                    message: MESSAGES.SERVICE_AREA_NOT_FOUND
                });
                return;
            }

            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: MESSAGES.SERVICE_AVAILABLE
            })

        } catch (error: any) {
            console.error("Error during login:", error);
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    }
}