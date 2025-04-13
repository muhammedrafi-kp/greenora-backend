import { Request, Response } from "express";
import { ICollectionController } from "../interfaces/collection/ICollectionController";
import { ICollectionservice } from "../interfaces/collection/ICollectionService";
import { HTTP_STATUS } from "../constants/httpStatus";
import { MESSAGES } from "../constants/messages";
import multer from 'multer';

const upload = multer({ dest: 'uploads/' });

export class CollectionController implements ICollectionController {
  
  constructor(private collectionService: ICollectionservice) { };

  async getCollectionHistory(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.headers['x-user-id'];
      const collectionHistories = await this.collectionService.getCollectionHistory(userId as string);
      res.status(HTTP_STATUS.OK).json({ success: true, data: collectionHistories });
    } catch (error: any) {
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: error.message });
    }
  }

  async getCollectionHistories(req: Request, res: Response): Promise<void> {
    try {

      const {
        status,
        districtId,
        serviceAreaId,
        startDate,
        endDate,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        search,
        page = 1,
        limit = 20,
      } = req.query;

      const queryOptions = {
        status: status?.toString(),
        districtId: districtId?.toString(),
        serviceAreaId: serviceAreaId?.toString(),
        startDate: startDate?.toString(),
        endDate: endDate?.toString(),
        sortBy: sortBy.toString(),
        sortOrder: sortOrder.toString(),
        search: search?.toString(),
        page: Number(page),
        limit: Number(limit),
      };
      // console.log("queryOptions :", queryOptions);

      const { collections, totalItems } = await this.collectionService.getCollectionHistories(queryOptions);
      
      res.status(HTTP_STATUS.OK).json({ success: true, collections, totalItems });
    } catch (error: any) {
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: error.message });
    }
  }

  async getAvailableCollectors(req: Request, res: Response): Promise<void> {
    try {
      const { serviceAreaId, preferredDate } = req.body;
      const collector = await this.collectionService.findAvailableCollector(serviceAreaId, preferredDate);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        collector
      });

    } catch (error: any) {
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: error.message });
    }
  }

  async getAssignedCollections(req: Request, res: Response): Promise<void> {
    try {
      const collectorId = req.headers['x-user-id'];

      const assignedCollections = await this.collectionService.getAssignedCollections(collectorId as string);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        collections: assignedCollections
      });

    } catch (error: any) {
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: error.message });
    }
  }

  async completeCollection(req: Request, res: Response): Promise<void> {
    try {
      const { collectionId } = req.params;
      const { paymentData, collectionData } = req.body;

      console.log("collectionId :", collectionId);
      console.log("paymentData in controller :", paymentData);
      console.log("collectionData in controller:", collectionData);

      if (!collectionId || !paymentData || !collectionData) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({ success: false, message: "Invalid input data" });
        return;
      }


      if (paymentData.method === 'cash') {
        await this.collectionService.processCashPayment(collectionId, collectionData, paymentData);
      } else if (paymentData.method === 'digital') {
        await this.collectionService.processDigitalPayment(collectionId, collectionData, paymentData);
      }

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: MESSAGES.COLLECTION_COMPLETED
      });

    } catch (error: any) {
      if (error.status === HTTP_STATUS.NOT_FOUND || error.status === HTTP_STATUS.BAD_REQUEST) {
        res.status(error.status).json({ success: false, message: error.message });
      } else {
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: error.message });
      }
    }
  }

  async cancelCollection(req: Request, res: Response): Promise<void> {
    try {
      const { collectionId, reason } = req.body;

      console.log("collectionId :", collectionId);
      console.log("reason :", reason);

      await this.collectionService.cancelCollection(collectionId, reason);
      res.status(HTTP_STATUS.OK).json({ success: true, message: "Collection cancelled successfully" });

    } catch (error: any) {

      if (error.status === HTTP_STATUS.BAD_REQUEST) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({ message: error.message });
      } else {
        console.error("Error during cancelling collection:", error.message);
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: error.message });
      }

    }
  }

}