import { Request, Response } from "express";
import { IServiceAreaController } from "../interfaces/serviceArea/IServiceAreaController";
import { IServiceAreaService } from "../interfaces/serviceArea/IServiceAreaService";
import { HTTP_STATUS } from "../constants/httpStatus";
import { MESSAGES } from "../constants/messages"

export class ServiceAreaController implements IServiceAreaController {
    constructor(private _serviceAreaService: IServiceAreaService) {
        this._serviceAreaService = _serviceAreaService;
    }

    async getDistricts(req: Request, res: Response): Promise<void> {
        try {

            const query: any = { isActive: true };
            const districts = await this._serviceAreaService.getDistricts(query);

            if (!districts) {
                res.status(HTTP_STATUS.NOT_FOUND).json({
                    success: true,
                    message: MESSAGES.DISTRICTS_NOT_FOUND
                });
                return;
            }

            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: MESSAGES.DISTRICTS_FETCHED,
                data: districts
            });

        } catch (error: any) {
            console.error("Error during login:", error);
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    }

    async getDistrictsByIds(req: Request, res: Response): Promise<void> {
        try {
            const { ids } = req.query;
            console.log("districtIds:", ids);
            const districtIds = typeof ids === 'string' ? ids.split(',') : [];
            console.log("districtIds:", districtIds);
            const districts = await this._serviceAreaService.getDistrictsByIds(districtIds);
            console.log("districts:", districts);
            res.status(HTTP_STATUS.OK).json(districts);
        } catch (error: any) {
            console.error("Error during login:", error);
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    }

    async createDistrict(req: Request, res: Response): Promise<void> {
        try {
            const districtName = req.body.name;

            const district = await this._serviceAreaService.createDistrict(districtName);

            res.status(HTTP_STATUS.CREATED).json({
                success: true,
                message: MESSAGES.DISTRICT_CREATED,
                data: district
            });

        } catch (error: any) {
            console.error("Error during creating district:", error);
            if (error.status === HTTP_STATUS.BAD_REQUEST) {
                res.status(error.status).json({ success: false, message: error.message });
            } else {
                res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: error.message });
            }
        }
    }

    async updateDistrict(req: Request, res: Response): Promise<void> {
        try {

            const { districtId } = req.params;
            const districtName = req.body.name;

            const updatedDistrict = await this._serviceAreaService.updateDistrict(districtId, districtName);

            console.log("updatedDistrict:", updatedDistrict);
            if (updatedDistrict) {
                res.status(HTTP_STATUS.OK).json({
                    success: true,
                    message: MESSAGES.DISTRICT_UPDATED,
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
            const updatedDistrict = await this._serviceAreaService.deleteDistrict(districtId);

            if (updatedDistrict) {
                res.status(HTTP_STATUS.OK).json({
                    success: true,
                    message: MESSAGES.DISTRICT_DELETED,
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



    async createServiceArea(req: Request, res: Response): Promise<void> {
        try {
            const serviceAreaData = req.body;
            console.log("data :",serviceAreaData);
            // const serviceArea = await this._serviceAreaService.createServiceArea(serviceAreaData);
            res.status(HTTP_STATUS.CREATED).json({
                success: true,
                message: MESSAGES.SERVICE_AREA_CREATED,
                // data: serviceArea
            });

        } catch (error: any) {
            console.error("Error during creating district:", error);
            if (error.status === HTTP_STATUS.BAD_REQUEST) {
                res.status(error.status).json({ success: false, message: error.message });
            } else {
                res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: error.message });
            }
        }
    }

    async getServiceAreasByDistrict(req: Request, res: Response): Promise<void> {
        try {
            const { districtId } = req.params;
            const serviceAreas = await this._serviceAreaService.getServiceAreas(districtId as string);

            if (!serviceAreas) {
                res.status(HTTP_STATUS.NOT_FOUND).json({
                    success: true,
                    message: MESSAGES.SERVICE_AREAS_NOT_FOUND
                });
                return;
            }

            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: MESSAGES.SERVICE_AREAS_FETCHED,
                data: serviceAreas
            });

        } catch (error: any) {
            console.error("Error during login:", error);
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    }

    async getServiceAreasByIds(req: Request, res: Response): Promise<void> {
        try {
            const { ids } = req.query;
            console.log("serviceAreaIds:", ids);
            const serviceAreaIds = typeof ids === 'string' ? ids.split(',') : [];
            console.log("serviceAreaIds:", serviceAreaIds);
            const serviceAreas = await this._serviceAreaService.getServiceAreasByIds(serviceAreaIds);
            console.log("serviceAreas:", serviceAreas);
            res.status(HTTP_STATUS.OK).json(serviceAreas);
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

            await this._serviceAreaService.isServiceAvailable(serviceAreaId, pinCode);

            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: MESSAGES.SERVICE_AVAILABLE
            })

        } catch (error: any) {

            if (error.status === HTTP_STATUS.BAD_REQUEST) {
                res.status(HTTP_STATUS.BAD_REQUEST).json({
                    success: false,
                    message: error.message
                });
                return;
            }

            console.error("Error during login:", error);
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    }

    async getDistrictWithServiceArea(req: Request, res: Response): Promise<void> {
        try {
            const { districtId, serviceAreaId } = req.params;

            console.log(districtId, serviceAreaId);

            const { district, serviceArea } = await this._serviceAreaService.getDistrictWithServiceArea(districtId, serviceAreaId);

            console.log("district:", district);
            console.log("serviceArea:", serviceArea);

            res.status(HTTP_STATUS.OK).json({
                success: true,
                district,
                serviceArea
            });

        } catch (error: any) {
            console.error("Error during login:", error);
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    }

    async getDistrictsWithServiceAreas(req: Request, res: Response): Promise<void> {
        try {
            const districtsAndServiceAreas = await this._serviceAreaService.getDistrictsWithServiceAreas();
            console.log(districtsAndServiceAreas);

            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: MESSAGES.DISTRICTS_WITH_SERVICE_AREAS_FETCHED,
                data: districtsAndServiceAreas
            });

        } catch (error: any) {
            console.error("Error during login:", error);
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    }
}