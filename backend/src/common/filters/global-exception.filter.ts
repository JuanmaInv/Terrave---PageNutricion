import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<{
      id?: string;
      method?: string;
      originalUrl?: string;
    }>();
    const response = ctx.getResponse<{
      status: (code: number) => { json: (body: unknown) => void };
    }>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;
    const error =
      exception instanceof Error ? exception.name : "UnhandledException";
    const requestId = request?.id ?? "n/a";
    const path = request?.originalUrl ?? "unknown";
    const method = request?.method ?? "UNKNOWN";

    if (status >= 500) {
      const message = exception instanceof Error ? exception.message : String(exception);
      this.logger.error(
        JSON.stringify({
          event: "request_failed",
          requestId,
          method,
          path,
          status,
          error,
          message,
        }),
        exception instanceof Error ? exception.stack : undefined
      );
    } else {
      this.logger.warn(
        JSON.stringify({
          event: "request_rejected",
          requestId,
          method,
          path,
          status,
          error,
        })
      );
    }

    const baseBody = {
      statusCode: status,
      requestId,
      timestamp: new Date().toISOString(),
      path,
    };

    if (exception instanceof HttpException) {
      const payload = exception.getResponse();
      const message =
        typeof payload === "string"
          ? payload
          : (payload as { message?: string | string[] }).message ?? exception.message;

      response.status(status).json({
        ...baseBody,
        message,
      });
      return;
    }

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      ...baseBody,
      message: "Internal server error",
    });
  }
}
