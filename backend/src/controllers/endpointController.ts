import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { EndpointService } from '../services/endpointService.js';
import { createEndpointSchema, updateEndpointSchema } from '../utils/validation.js';

export class EndpointController {
  static async listEndpoints(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { apiId } = req.params;
      const endpoints = await EndpointService.listEndpoints(req.user!.orgId, apiId);
      res.status(200).json({
        success: true,
        data: endpoints,
      });
    } catch (error) {
      next(error);
    }
  }

  static async createEndpoint(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { apiId } = req.params;
      const validatedInput = createEndpointSchema.parse(req.body);
      const endpoint = await EndpointService.createEndpoint(req.user!.orgId, apiId, validatedInput);
      res.status(201).json({
        success: true,
        data: endpoint,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateEndpoint(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { apiId, endpointId } = req.params;
      const validatedInput = updateEndpointSchema.parse(req.body);
      const endpoint = await EndpointService.updateEndpoint(
        req.user!.orgId,
        apiId,
        endpointId,
        validatedInput
      );
      res.status(200).json({
        success: true,
        data: endpoint,
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteEndpoint(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { apiId, endpointId } = req.params;
      const result = await EndpointService.deleteEndpoint(req.user!.orgId, apiId, endpointId);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}
