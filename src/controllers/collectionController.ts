import { Request, response, Response } from "express";
import { ICollectionController } from "../interfaces/collection/ICollectionController";
import { ICollectionservice } from "../interfaces/collection/ICollectionService";
import { HTTP_STATUS } from "../constants/httpStatus";
import { MESSAGES } from "../constants/messages";
import multer from 'multer';

const upload = multer({ dest: 'uploads/' });

export class CollectionController implements ICollectionController {

  constructor(private collectionService: ICollectionservice) { };


  async initiateAdvancePayment(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.headers['x-client-id'] as string;
      const { paymentMethod, collectionData } = req.body;

      console.log("collectionData :", collectionData);
      console.log("Payment Method:", paymentMethod);
      console.log("UserId:", userId);

      if (!collectionData || Object.keys(collectionData).length === 0 || !paymentMethod) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: MESSAGES.COLLECTION_DATA_REQUIRED,
        });
        return;
      }

      const response = await this.collectionService.initiatePayment(userId, paymentMethod, collectionData);
      res.status(HTTP_STATUS.OK).json({ success: true, message: "Payment initiated successfully", data: response });

    } catch (error: any) {

      if (error.status === HTTP_STATUS.BAD_REQUEST || error.status === HTTP_STATUS.NOT_FOUND) {
        res.status(error.status).json({ success: false, message: error.message });
      } else {
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: error.message });
      }
    }
  }


  async verifyAdvancePayment(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.headers['x-client-id'] as string;
      const razorpayVerificationData = req.body;

      console.log("userId :", userId);
      console.log("razorpayVerificationData :", razorpayVerificationData)

      await this.collectionService.verifyAdvancePayment(userId, razorpayVerificationData);

      res.status(HTTP_STATUS.OK).json({ success: true, message: MESSAGES.PAYMENT_SUCCESSFULL });

    } catch (error: any) {
      if (error.status === HTTP_STATUS.BAD_REQUEST || error.status === HTTP_STATUS.NOT_FOUND) {
        res.status(error.status).json({ success: false, message: error.message });
      } else {
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: error.message });
      }
    }
  }


  async scheduleCollectionManually(req: Request, res: Response): Promise<void> {
    try {
      const collectionId = req.params.collectionId;
      const { collectorId, userId, preferredDate } = req.body;
      console.log("collectionId :", collectionId);
      console.log("collectorId :", collectorId);
      console.log("userId :", userId);
      console.log("preferredDate :", preferredDate);
      const response = await this.collectionService.scheduleCollectionManually(collectionId, collectorId, userId, preferredDate);
      console.log("response :", response);
      res.status(HTTP_STATUS.OK).json({ success: true, message: "Collection scheduled successfully" });
    } catch (error: any) {
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: error.message });
    }
  }

  async getCollectionHistory(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.headers['x-client-id'] as string;
      console.log("params:", req.query);

      const {
        status,
        type,
        startDate,
        endDate,
        page = 1,
        limit = 10,
      } = req.query;

      const queryOptions = {
        status: status?.toString(),
        type: type?.toString(),
        startDate: startDate?.toString(),
        endDate: endDate?.toString(),
        page: Number(page),
        limit: Number(limit),
      };

      const collectionHistories = await this.collectionService.getCollectionHistory(userId, queryOptions);
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
        limit = 10,
      } = req.query;

      console.log("req.query :", req.query);
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
      console.log("queryOptions :", queryOptions);

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
      const collectorId = req.headers['x-client-id'];
      const {
        status,
        startDate,
        endDate,
        page = 1,
        limit = 10
      } = req.query;
      console.log("req.query :", req.query);

      const collections = await this.collectionService.getAssignedCollections(
        collectorId as string,
        {
          status: status as string,
          startDate: startDate as string,
          endDate: endDate as string,
          page: Number(page),
          limit: Number(limit)
        }
      );

      res.status(HTTP_STATUS.OK).json({
        success: true,
        collections
      });

    } catch (error: any) {
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: error.message });
    }
  }

  async completeCollection(req: Request, res: Response): Promise<void> {
    try {
      const { collectionId } = req.params;
      const { paymentMethod, collectionData } = req.body;

      const collectionProofs = req.files as Express.Multer.File[];

      const parsedCollectionData = JSON.parse(collectionData);

      console.log("Uploaded files:", collectionProofs);
      console.log("collectionId :", collectionId);
      console.log("paymentMethod :",  paymentMethod);
      console.log("collectionData in controller:", parsedCollectionData);

      if (!collectionId || !paymentMethod || !collectionData || !collectionProofs) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({ success: false, message: "Invalid input data" });
        return;
      }

      await this.collectionService.completeCollection(collectionId, parsedCollectionData, collectionProofs, paymentMethod);

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
    console.log("req.body :", req.body);
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


  async requestCollectionPayment(req: Request, res: Response): Promise<void> {
    try {
      const { collectionData } = req.body;
      const collectionProofs = req.files as Express.Multer.File[];

      console.log("collectionData :", collectionData);
      console.log("collectionProofs :", collectionProofs);

      if (!collectionData || !collectionProofs) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({ success: false, message: "Invalid input data" });
        return;
      }

      const parsedCollectionData = JSON.parse(collectionData);

      await this.collectionService.requestCollectionPayment(parsedCollectionData, collectionProofs);

      res.status(HTTP_STATUS.OK).json({ success: true, message: "Payment requested successfully" });

    } catch (error: any) {
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: error.message });
    }
  }

  async verifyCollectionPayment(req: Request, res: Response): Promise<void> {
    try {
      const { collectionId, razorpayVerificationData } = req.body;
      console.log("collectionId :", collectionId);
      console.log("razorpayVerificationData :", razorpayVerificationData);

      await this.collectionService.verifyCollectionPayment(collectionId, razorpayVerificationData);

      res.status(HTTP_STATUS.OK).json({ success: true, message: "Payment verified successfully" });

    } catch (error: any) {
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: error.message });
    }
  }


  async getRevenueData(req: Request, res: Response): Promise<void> {
    try {
      const { districtId, serviceAreaId, dateFilter, startDate, endDate } = req.query;

      const queryOptions = {
        districtId: districtId?.toString(),
        serviceAreaId: serviceAreaId?.toString(),
        dateFilter: dateFilter?.toString(),
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined
      };

      console.log("queryOptions :", queryOptions);

      const data = await this.collectionService.getRevenueData(queryOptions);

      console.log("revenue data :", data);

      res.status(HTTP_STATUS.OK).json({ success: true, data });

    } catch (error: any) {
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: error.message });
    }
  }

}