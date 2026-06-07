// src/utils/ApiResponse.ts — Standardized API response format

export interface ApiSuccessResponse<T = any> {
  success: true;
  message: string;
  data: T;
  timestamp: string;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
  timestamp: string;
}

export interface PaginatedData<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class ApiResponse {
  static success<T>(
    data: T,
    message = 'Success',
    statusCode = 200
  ): { statusCode: number; body: ApiSuccessResponse<T> } {
    return {
      statusCode,
      body: {
        success: true,
        message,
        data,
        timestamp: new Date().toISOString(),
      },
    };
  }

  static created<T>(
    data: T,
    message = 'Created successfully'
  ): { statusCode: number; body: ApiSuccessResponse<T> } {
    return ApiResponse.success(data, message, 201);
  }

  static paginated<T>(
    items: T[],
    total: number,
    page: number,
    limit: number,
    message = 'Success'
  ): { statusCode: number; body: ApiSuccessResponse<PaginatedData<T>> } {
    return ApiResponse.success(
      {
        data: items,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      message
    );
  }

  static error(
    message: string,
    statusCode = 500,
    errors?: Record<string, string[]>
  ): { statusCode: number; body: ApiErrorResponse } {
    return {
      statusCode,
      body: {
        success: false,
        message,
        errors,
        timestamp: new Date().toISOString(),
      },
    };
  }

  static notFound(
    resource = 'Resource'
  ): { statusCode: number; body: ApiErrorResponse } {
    return ApiResponse.error(`${resource} not found`, 404);
  }

  static unauthorized(): { statusCode: number; body: ApiErrorResponse } {
    return ApiResponse.error('Unauthorized', 401);
  }

  static forbidden(): { statusCode: number; body: ApiErrorResponse } {
    return ApiResponse.error('Forbidden', 403);
  }

  static validationError(
    errors: Record<string, string[]>
  ): { statusCode: number; body: ApiErrorResponse } {
    return ApiResponse.error('Validation failed', 422, errors);
  }
}
