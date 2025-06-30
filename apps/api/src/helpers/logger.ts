import { LogsInfoRepository } from '../repo/logsInfoRepo';
import { Request } from 'express';

interface ErrorLogData {
  controller: string;
  method: string;
  error: any;
  userId?: number;
  requestData?: any;
  additionalInfo?: any;
}

export class Logger {
  /**
   * Log error to console and database (compact format)
   */
  static async logError(controller: string, method: string, error: any, req?: Request): Promise<void>;
  /**
   * Log error to console and database (detailed format)
   */
  static async logError(data: ErrorLogData): Promise<void>;
  /**
   * Implementation for both overloads
   */
  static async logError(controllerOrData: string | ErrorLogData, method?: string, error?: any, req?: Request): Promise<void> {
    let data: ErrorLogData;
    
    if (typeof controllerOrData === 'string') {
      // Compact format: logError('controller', 'method', error, req)
      data = {
        controller: controllerOrData,
        method: method!,
        error: error,
        requestData: req ? this.extractRequestData(req) : undefined,
      };
    } else {
      // Detailed format: logError({ controller, method, error, ... })
      data = controllerOrData;
    }

    this.performErrorLogging(data);
  }

  /**
   * Internal method to perform the actual error logging
   */
  private static async performErrorLogging(data: ErrorLogData): Promise<void> {
    const timestamp = new Date();
    const logMessage = {
      level: 'ERROR',
      controller: data.controller,
      method: data.method,
      error: {
        message: data.error?.message || 'Unknown error',
        stack: data.error?.stack || null,
        name: data.error?.name || null,
      },
      requestData: data.requestData || null,
      additionalInfo: data.additionalInfo || null,
      timestamp: timestamp.toISOString(),
    };

    // Log to console for immediate visibility
    console.error(`[${timestamp.toISOString()}] ERROR in ${data.controller}.${data.method}:`, {
      message: data.error?.message || 'Unknown error',
      stack: data.error?.stack || null,
      requestData: data.requestData || null,
      additionalInfo: data.additionalInfo || null,
    });

    // Log to database
    // try {
    //   await LogsInfoRepository.addLogsInfo({
    //     user_id: data.userId || 0, // Use 0 for system errors when no user context
    //     logs: JSON.stringify(logMessage),
    //     timestamp: timestamp,
    //     phone_info: null,
    //     device_info: null,
    //   });
    // } catch (dbError) {
    //   // If database logging fails, at least log to console
    //   console.error('[LOGGER] Failed to save error log to database:', dbError);
    // }
  }

  /**
   * Log info message to console and optionally to database
   */
  static async logInfo(message: string, data?: any, userId?: number): Promise<void> {
    const timestamp = new Date();
    const logMessage = {
      level: 'INFO',
      message,
      data: data || null,
      timestamp: timestamp.toISOString(),
    };

    console.log(`[${timestamp.toISOString()}] INFO: ${message}`, data || '');

    // Optionally save info logs to database (you might want to make this configurable)
    if (userId) {
      try {
        await LogsInfoRepository.addLogsInfo({
          user_id: userId,
          logs: JSON.stringify(logMessage),
          timestamp: timestamp,
          phone_info: null,
          device_info: null,
        });
      } catch (dbError) {
        console.error('[LOGGER] Failed to save info log to database:', dbError);
      }
    }
  }

  /**
   * Extract relevant request data for logging (excluding sensitive information)
   */
  static extractRequestData(req: any): any {
    return {
      method: req.method,
      url: req.url,
      params: req.params,
      query: req.query,
      userAgent: req.get('User-Agent'),
      ip: req.ip || req.connection?.remoteAddress,
      // Note: We intentionally exclude req.body as it might contain sensitive data
      // If you need to log request body, make sure to sanitize it first
    };
  }
}