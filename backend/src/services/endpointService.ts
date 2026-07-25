import { prisma } from '../config/prisma.js';
import { NotFoundError } from '../utils/errors.js';
import { ApiService } from './apiService.js';

export interface CreateEndpointInput {
  path: string;
  method: string;
  description?: string;
  costPerCall?: number;
  enabled?: boolean;
}

export interface UpdateEndpointInput {
  path?: string;
  method?: string;
  description?: string;
  costPerCall?: number;
  enabled?: boolean;
}

export class EndpointService {
  static async listEndpoints(orgId: string, apiId: string) {
    await ApiService.getApiById(orgId, apiId); // Enforces tenant ownership check

    return prisma.endpoint.findMany({
      where: { apiId },
      orderBy: { path: 'asc' },
    });
  }

  static async createEndpoint(orgId: string, apiId: string, input: CreateEndpointInput) {
    await ApiService.getApiById(orgId, apiId);

    return prisma.endpoint.create({
      data: {
        apiId,
        path: input.path,
        method: input.method.toUpperCase(),
        description: input.description,
        costPerCall: input.costPerCall ?? 0,
        enabled: input.enabled ?? true,
      },
    });
  }

  static async updateEndpoint(
    orgId: string,
    apiId: string,
    endpointId: string,
    input: UpdateEndpointInput
  ) {
    await ApiService.getApiById(orgId, apiId);

    const existingEndpoint = await prisma.endpoint.findFirst({
      where: { id: endpointId, apiId },
    });

    if (!existingEndpoint) {
      throw new NotFoundError('Endpoint not found under this API');
    }

    return prisma.endpoint.update({
      where: { id: endpointId },
      data: {
        ...(input.path && { path: input.path }),
        ...(input.method && { method: input.method.toUpperCase() }),
        ...(input.description !== undefined && { description: input.description }),
        ...(input.costPerCall !== undefined && { costPerCall: input.costPerCall }),
        ...(input.enabled !== undefined && { enabled: input.enabled }),
      },
    });
  }

  static async deleteEndpoint(orgId: string, apiId: string, endpointId: string) {
    await ApiService.getApiById(orgId, apiId);

    const existingEndpoint = await prisma.endpoint.findFirst({
      where: { id: endpointId, apiId },
    });

    if (!existingEndpoint) {
      throw new NotFoundError('Endpoint not found under this API');
    }

    await prisma.endpoint.delete({
      where: { id: endpointId },
    });

    return { message: 'Endpoint deleted successfully' };
  }
}
