import { prisma } from '../config/prisma.js';
import { NotFoundError } from '../utils/errors.js';
import { ApiEnvironment, ApiStatus } from '@prisma/client';

export interface CreateApiInput {
  name: string;
  description?: string;
  upstreamBaseUrl: string;
  environment?: ApiEnvironment;
}

export interface UpdateApiInput {
  name?: string;
  description?: string;
  upstreamBaseUrl?: string;
  environment?: ApiEnvironment;
  status?: ApiStatus;
}

export class ApiService {
  static async listApis(orgId: string) {
    return prisma.api.findMany({
      where: { orgId },
      include: {
        endpoints: true,
        _count: {
          select: { apiKeys: true, endpoints: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async getApiById(orgId: string, apiId: string) {
    const api = await prisma.api.findFirst({
      where: { id: apiId, orgId },
      include: {
        endpoints: true,
        apiKeys: {
          select: {
            id: true,
            keyPrefix: true,
            status: true,
            rateLimitPerMin: true,
            createdAt: true,
          },
        },
      },
    });

    if (!api) {
      throw new NotFoundError('API service not found in your organization');
    }

    return api;
  }

  static async createApi(orgId: string, input: CreateApiInput) {
    return prisma.api.create({
      data: {
        orgId,
        name: input.name,
        description: input.description,
        upstreamBaseUrl: input.upstreamBaseUrl,
        environment: input.environment || ApiEnvironment.production,
      },
    });
  }

  static async updateApi(orgId: string, apiId: string, input: UpdateApiInput) {
    const existingApi = await prisma.api.findFirst({
      where: { id: apiId, orgId },
    });

    if (!existingApi) {
      throw new NotFoundError('API service not found in your organization');
    }

    return prisma.api.update({
      where: { id: apiId },
      data: input,
    });
  }

  static async archiveApi(orgId: string, apiId: string) {
    return ApiService.updateApi(orgId, apiId, { status: ApiStatus.archived });
  }

  static async deleteApi(orgId: string, apiId: string) {
    const existingApi = await prisma.api.findFirst({
      where: { id: apiId, orgId },
    });

    if (!existingApi) {
      throw new NotFoundError('API service not found in your organization');
    }

    await prisma.api.delete({
      where: { id: apiId },
    });

    return { message: 'API service permanently deleted' };
  }
}
