import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { UserService } from '../services/userService.js';
import { updateProfileSchema, changePasswordSchema } from '../utils/validation.js';

export class UserController {
  static async updateProfile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const validatedInput = updateProfileSchema.parse(req.body);
      const updatedUser = await UserService.updateProfile(req.user!.userId, validatedInput);
      res.status(200).json({
        success: true,
        data: updatedUser,
      });
    } catch (error) {
      next(error);
    }
  }

  static async changePassword(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const validatedInput = changePasswordSchema.parse(req.body);
      const result = await UserService.changePassword(req.user!.userId, validatedInput);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}
