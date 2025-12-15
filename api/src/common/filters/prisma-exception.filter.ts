import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
} from '@nestjs/common';
import { Prisma } from '../../generated/prisma';
import { Request, Response } from 'express';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const { status, message } = this.mapException(exception);

    response.status(status).json({
      statusCode: status,
      message,
      error: 'PrismaClientKnownRequestError',
    });
  }

  private mapException(exception: Prisma.PrismaClientKnownRequestError) {
    const meta = (exception.meta ?? {}) as PrismaKnownErrorMeta;

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';

    switch (exception.code) {
      case 'P2003': {
        status = HttpStatus.BAD_REQUEST;
        const field = this.getConstraintField(meta) ?? 'unknown field';
        message = `Foreign key constraint failed: ${field} does not reference an existing record`;
        break;
      }

      case 'P2002': {
        status = HttpStatus.CONFLICT;
        const fields = this.getTargetFields(meta) ?? 'unknown fields';
        message = `Unique constraint failed on: ${fields}`;
        break;
      }

      case 'P2025': {
        status = HttpStatus.NOT_FOUND;
        message = 'Record not found';
        break;
      }

      case 'P2000': {
        status = HttpStatus.BAD_REQUEST;
        message =
          "The provided value for the column is too long for the column's type.";
        break;
      }

      case 'P2001': {
        status = HttpStatus.NOT_FOUND;
        message =
          'The record searched for in the where condition does not exist.';
        break;
      }

      case 'P2004': {
        status = HttpStatus.BAD_REQUEST;
        message = 'A constraint failed on the database.';
        break;
      }

      default: {
        message = exception.message;
        break;
      }
    }

    return { status, message };
  }

  private getConstraintField(meta: PrismaKnownErrorMeta) {
    const constraint = this.getConstraintName(meta);
    if (!constraint) return undefined;
    return constraint.includes('_') ? constraint.split('_')[1] : constraint;
  }

  private getTargetFields(meta: PrismaKnownErrorMeta) {
    return meta.target?.join(', ');
  }

  private getConstraintName(meta: PrismaKnownErrorMeta) {
    return meta.constraint ?? meta.field_name;
  }
}

interface PrismaKnownErrorMeta extends Record<string, unknown> {
  target?: string[];
  constraint?: string;
  field_name?: string;
}
