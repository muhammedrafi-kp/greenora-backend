import { Request, response, Response } from "express";
import { ICollectionController } from "../interfaces/collection/ICollectionController";
import { ICollectionservice } from "../interfaces/collection/ICollectionService";
import { HTTP_STATUS } from "../constants/httpStatus";
import { MESSAGES } from "../constants/messages";
import multer from 'multer';

const upload = multer({ dest: 'uploads/' });

export class CollectionController implements ICollectionController {

  constructor(private _collectionService: ICollectionservice) { };


  async initiateRazorpayAdvance(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.headers['x-client-id'] as string;
      const collectionData = req.body;

      console.log("collectionData :", collectionData);

      if (!collectionData || Object.keys(collectionData).length === 0) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: MESSAGES.COLLECTION_DATA_REQUIRED,
        });
        return;
      }

      const response = await this._collectionService.initiateRazorpayAdvance(userId, collectionData);

      res.status(HTTP_STATUS.OK).json({ success: true, message: "Payment initiated successfully", data: response });

    } catch (error: any) {

      if (error.status === HTTP_STATUS.BAD_REQUEST || error.status === HTTP_STATUS.NOT_FOUND) {
        res.status(error.status).json({ success: false, message: error.message });
      } else {
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: error.message });
      }

    }
  }


  async verifyRazorpayAdvance(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.headers['x-client-id'] as string;
      const razorpayVerificationData = req.body;

      console.log("userId :", userId);
      console.log("razorpayVerificationData :", razorpayVerificationData)

      await this._collectionService.verifyRazorpayAdvance(userId, razorpayVerificationData);

      res.status(HTTP_STATUS.OK).json({ success: true, message: MESSAGES.PAYMENT_SUCCESSFULL });

    } catch (error: any) {
      if (error.status === HTTP_STATUS.BAD_REQUEST || error.status === HTTP_STATUS.NOT_FOUND) {
        res.status(error.status).json({ success: false, message: error.message });
      } else {
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: error.message });
      }
    }
  }


  async payAdvanceWithWallet(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.headers['x-client-id'] as string;
      const collectionData = req.body;

      console.log("collectionData :", collectionData);

      await this._collectionService.payAdvanceWithWallet(userId, collectionData);

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
      const response = await this._collectionService.scheduleCollectionManually(collectionId, collectorId, userId, preferredDate);
      console.log("response :", response);
      res.status(HTTP_STATUS.OK).json({ success: true, message: MESSAGES.COLLECTION_SCHEDULED });
    } catch (error: any) {
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: error.message });
    }
  }

  async getCollection(req: Request, res: Response): Promise<void> {
    try {
      const collectionId = req.params.collectionId;

      if (!collectionId) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: MESSAGES.COLLECTION_DATA_REQUIRED,
        });
        return;
      }

      const collection = await this._collectionService.getCollection(collectionId);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: MESSAGES.COLLECTION_SCHEDULED,
        data: collection
      });

    } catch (error: any) {

      if (error.status === HTTP_STATUS.NOT_FOUND) {
        res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: error.message
        });
        return;
      }

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

      const collections = await this._collectionService.getCollectionHistory(userId, queryOptions);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: MESSAGES.COLLECTIONS_FETCHED,
        data: collections
      });

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

      const { collections, totalItems } = await this._collectionService.getCollectionHistories(queryOptions);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: MESSAGES.COLLECTIONS_FETCHED,
        data: { collections, totalItems }
      });

    } catch (error: any) {
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: error.message });
    }
  }

  async getAvailableCollectors(req: Request, res: Response): Promise<void> {
    try {
      const { serviceAreaId, preferredDate } = req.body;

      const collector = await this._collectionService.findAvailableCollector(serviceAreaId, preferredDate);

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

      const collections = await this._collectionService.getAssignedCollections(
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
        message: MESSAGES.COLLECTIONS_FETCHED,
        data: collections
      });

    } catch (error: any) {
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: error.message });
    }
  }

  async completeCollection(req: Request, res: Response): Promise<void> {
    try {
      const { collectionId } = req.params;
      const { paymentMethod, collectionData } = req.body;

      console.log("paymentMethod :", paymentMethod);

      const collectionProofs = req.files as Express.Multer.File[];

      const parsedCollectionData = JSON.parse(collectionData);

      console.log("Uploaded files:", collectionProofs);
      console.log("collectionId :", collectionId);
      console.log("paymentMethod :", paymentMethod);
      console.log("collectionData in controller:", parsedCollectionData);

      if (!collectionId || !paymentMethod || !collectionData || !collectionProofs) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({ success: false, message: "Invalid input data" });
        return;
      }

      await this._collectionService.completeCollection(collectionId, parsedCollectionData, collectionProofs, paymentMethod);

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

      await this._collectionService.cancelCollection(collectionId, reason);

      res.status(HTTP_STATUS.OK).json({ success: true, message: MESSAGES.COLLECTION_CANCELLED });

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

      await this._collectionService.requestCollectionPayment(parsedCollectionData, collectionProofs);

      res.status(HTTP_STATUS.OK).json({ success: true, message: MESSAGES.PAYMENT_REQUESTED });

    } catch (error: any) {
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: error.message });
    }
  }

  async verifyRazorpayPayment(req: Request, res: Response): Promise<void> {
    try {
      const { collectionId, razorpayVerificationData } = req.body;
      console.log("collectionId :", collectionId);
      console.log("razorpayVerificationData :", razorpayVerificationData);

      await this._collectionService.verifyRazorpayPayment(collectionId, razorpayVerificationData);

      res.status(HTTP_STATUS.OK).json({ success: true, message: "Payment verified successfully" });

    } catch (error: any) {
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: error.message });
    }
  }

  async payWithWallet(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.headers['x-client-id'] as string;
      const { collectionId } = req.body;

      console.log("collectionId :", collectionId);

      await this._collectionService.payWithWallet(userId, collectionId);

      res.status(HTTP_STATUS.OK).json({ success: true, message: MESSAGES.PAYMENT_SUCCESSFULL });

    } catch (error: any) {

      if (error.status === HTTP_STATUS.NOT_FOUND || error.status === HTTP_STATUS.BAD_REQUEST) {
        res.status(error.status).json({ success: false, message: error.message });
      } else {
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: error.message });
      }
    }
  }

  async getDashboardData(req: Request, res: Response): Promise<void> {
    try {

      const data = await this._collectionService.getDashboardData();

      res.status(HTTP_STATUS.OK).json({ success: true, data });
    } catch (error: any) {
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: error.message });
    }
  }

  async getCollectorDashboardData(req: Request, res: Response): Promise<void> {
    try {
      const collectorId = req.headers['x-client-id'] as string;
      const data = await this._collectionService.getCollectorDashboardData(collectorId);
      res.status(HTTP_STATUS.OK).json({ success: true, data });
    } catch (error: any) {
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: error.message });
    }
  }

  async getRevenueData(req: Request, res: Response): Promise<void> {
    try {
      const { districtId, serviceAreaId, dateFilter, startDate, endDate } = req.query;

      if (!dateFilter) {
        res.status(400).json({ message: "dateFilter is required" });
        return;
      }

      const queryOptions = {
        districtId: districtId?.toString(),
        serviceAreaId: serviceAreaId?.toString(),
        dateFilter: dateFilter?.toString(),
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined
      };

      console.log("queryOptions :", queryOptions);

      const data = await this._collectionService.getRevenueData(queryOptions);

      // console.log("revenue data :", data);

      res.status(HTTP_STATUS.OK).json({ success: true, data });

    } catch (error: any) {
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: error.message });
    }
  }





  async getCollectorRevenueData(req: Request, res: Response): Promise<void> {
    try {
      const collectorId = req.headers['x-client-id'] as string;
      const { dateFilter, startDate, endDate } = req.query;

      console.log("collectorId :", collectorId);
      console.log("dateFilter :", dateFilter);
      console.log("startDate :", startDate);
      console.log("endDate :", endDate);



      if (!collectorId) {
        res.status(400).json({ message: "collectorId is required" });
        return;
      }

      if (!dateFilter) {
        res.status(400).json({ message: "dateFilter is required" });
        return;
      }

      if (dateFilter === "custom" && (!startDate || !endDate)) {
        res.status(400).json({ message: "startDate and endDate are required for custom range" });
        return;
      }

      const queryOptions = {
        collectorId: collectorId as string,
        dateFilter: dateFilter as string,
        startDate: startDate?.toString(),
        endDate: endDate?.toString()
      };

      const revenueData = await this._collectionService.getCollectorRevenueData(queryOptions);



      res.status(HTTP_STATUS.OK).json({ success: true, data: revenueData });



    } catch (error: any) {
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: error.message });
    }
  }

}