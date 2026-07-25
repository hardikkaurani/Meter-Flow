import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { ApiService } from '../services/apiService.js';
import { createApiSchema, updateApiSchema } from '../utils/validation.js';

export class ApiController {
  static async listApis(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const apis = await ApiService.listApis(req.user!.orgId);
      res.status(200).json({
        success: true,
        data: apis,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getApiById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { apiId } = req.params;
      const api = await ApiService.getApiById(req.user!.orgId, apiId);
      res.status(200).json({
        success: true,
        data: api,
      });
    } catch (error) {
      next(error);
    }
  }

  static async createApi(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const validatedInput = createApiSchema.parse(req.body);
      const api = await ApiService.createApi(req.user!.orgId, validatedInput);
      res.status(201).json({
        success: true,
        data: api,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateApi(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { apiId } = req.params;
      const validatedInput = updateApiSchema.parse(req.body);
      const api = await ApiService.updateApi(req.user!.orgId, apiId, validatedInput);
      res.status(200).json({
        success: true,
        data: api,
      });
    } catch (error) {
      next(error);
    }
  }

  static async archiveApi(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { apiId } = req.params;
      const api = await ApiService.archiveApi(req.user!.orgId, apiId);
      res.status(200).json({
        success: true,
        data: api,
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteApi(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { apiId } = req.params;
      const result = await ApiService.deleteApi(req.user!.orgId, apiId);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}
