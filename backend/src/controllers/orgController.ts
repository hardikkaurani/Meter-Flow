import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { OrgService } from '../services/orgService.js';
import { createOrgSchema, inviteMemberSchema, updateMemberRoleSchema } from '../utils/validation.js';

export class OrgController {
  static async getOrganization(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const org = await OrgService.getOrganization(req.user!.orgId);
      res.status(200).json({
        success: true,
        data: org,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateOrganization(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name } = createOrgSchema.parse(req.body);
      const updatedOrg = await OrgService.updateOrganization(req.user!.orgId, name);
      res.status(200).json({
        success: true,
        data: updatedOrg,
      });
    } catch (error) {
      next(error);
    }
  }

  static async inviteMember(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const validatedInput = inviteMemberSchema.parse(req.body);
      const invitation = await OrgService.inviteMember(req.user!.orgId, validatedInput);
      res.status(201).json({
        success: true,
        data: invitation,
      });
    } catch (error) {
      next(error);
    }
  }

  static async joinOrganization(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token } = req.body;
      const user = await OrgService.joinOrganization(req.user!.userId, token);
      res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateMemberRole(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.params.userId as string;
      const { role } = updateMemberRoleSchema.parse(req.body);
      const member = await OrgService.updateMemberRole(req.user!.orgId, req.user!.role, userId, role);
      res.status(200).json({
        success: true,
        data: member,
      });
    } catch (error) {
      next(error);
    }
  }
}
