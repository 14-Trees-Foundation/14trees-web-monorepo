import { Request, Response, NextFunction } from 'express';
import { Logger } from '../helpers/logger';

/**
 * Middleware to log requests, focusing on errors and important operations
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    const originalSend = res.send;
    const originalJson = res.json;
    
    // Capture response data
    let responseData: any = null;
    let responseStatusCode: number = 200;

    // Override res.send to capture response
    res.send = function(data: any) {
        responseData = data;
        responseStatusCode = res.statusCode;
        return originalSend.call(this, data);
    };

    // Override res.json to capture response
    res.json = function(data: any) {
        responseData = data;
        responseStatusCode = res.statusCode;
        return originalJson.call(this, data);
    };

    // Log response when request completes
    res.on('finish', () => {
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        // Only log if there's an error (non-200 status) or for critical endpoints
        const shouldLog = responseStatusCode >= 400 || isCriticalEndpoint(req.path);
        
        if (shouldLog) {
            const logData = {
                method: req.method,
                url: req.url,
                path: req.path,
                statusCode: responseStatusCode,
                duration: `${duration}ms`,
                params: req.params,
                query: req.query,
                headers: {
                    'user-agent': req.get('User-Agent'),
                    'content-type': req.get('Content-Type'),
                    'x-user-id': req.get('x-user-id'),
                    'authorization': req.get('Authorization') ? '[PRESENT]' : '[NOT_PRESENT]'
                },
                ip: req.ip || req.connection?.remoteAddress,
                body: getSanitizedBody(req),
                responseBody: responseStatusCode >= 400 ? responseData : '[SUCCESS_RESPONSE_OMITTED]',
                timestamp: new Date().toISOString()
            };

            if (responseStatusCode >= 400) {
                Logger.logError({
                    controller: 'RequestMiddleware',
                    method: 'requestLogger',
                    error: new Error(`HTTP ${responseStatusCode}: ${JSON.stringify(responseData)}`),
                    requestData: logData,
                    additionalInfo: {
                        endpoint: req.path,
                        duration,
                        statusCode: responseStatusCode
                    }
                });
            } else {
                Logger.logInfo('Critical endpoint accessed', logData);
            }
        }
    });

    next();
};

/**
 * Determine if this is a critical endpoint that should always be logged
 * You can customize this list based on your application's needs
 */
function isCriticalEndpoint(path: string): boolean {
    const criticalEndpoints = [
        '/book', 
        '/unbook'
    ];
    return criticalEndpoints.some(endpoint => path.includes(endpoint));
}

/**
 * Sanitize request body to remove sensitive information
 */
function getSanitizedBody(req: Request): any {
    if (!req.body) return null;

    const sensitiveFields = ['password', 'token', 'secret', 'key', 'authorization'];
    const sanitized = { ...req.body };

    // Remove or mask sensitive fields
    Object.keys(sanitized).forEach(key => {
        if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
            sanitized[key] = '[REDACTED]';
        }
    });

    // For file uploads, just log metadata
    if (req.files) {
        if (Array.isArray(req.files)) {
            // req.files is File[]
            sanitized._files = {
                type: 'array',
                fileCount: req.files.length
            };
        } else {
            // req.files is { [fieldname: string]: File[]; }
            sanitized._files = Object.keys(req.files).map(key => ({
                fieldName: key,
                fileCount: Array.isArray(req.files[key]) ? req.files[key].length : 1
            }));
        }
    }

    return sanitized;
}