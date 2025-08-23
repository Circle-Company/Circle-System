import { v4 as uuid } from 'uuid';

class BaseError extends Error {
  public name: string;
  public message: string;
  public action?: string;
  public statusCode: number;
  public errorId: string;
  public requestId?: string;
  public context?: any;
  public stack?: string;
  public errorLocationCode?: number;
  public key?: string;
  public type?: string;
  public databaseErrorCode?: string;

  constructor({
    message,
    stack,
    action,
    statusCode,
    errorId,
    requestId,
    context,
    errorLocationCode,
    key,
    type,
    databaseErrorCode,
  }: {
    message: string;
    stack?: string;
    action?: string;
    statusCode?: number;
    errorId?: string;
    requestId?: string;
    context?: any;
    errorLocationCode?: number;
    key?: string;
    type?: string;
    databaseErrorCode?: string;
  }) {
    super();
    this.name = this.constructor.name;
    this.message = message;
    this.action = action;
    this.statusCode = statusCode || 500;
    this.errorId = errorId || uuid();
    this.requestId = requestId;
    this.context = context;
    this.stack = stack;
    this.errorLocationCode = errorLocationCode;
    this.key = key;
    this.type = type;
    this.databaseErrorCode = databaseErrorCode;
  }
}

class InternalServerError extends BaseError {
  constructor({
    message,
    action,
    requestId,
    errorId,
    statusCode,
    stack,
    errorLocationCode,
  }: {
    message?: string;
    action?: string;
    requestId?: string;
    errorId?: string;
    statusCode?: number;
    stack?: string;
    errorLocationCode?: number;
  }) {
    super({
      message: message || 'Um erro interno não esperado aconteceu.',
      action: action || "Informe ao suporte o valor encontrado no campo 'error_id'.",
      statusCode: statusCode || 500,
      requestId,
      errorId,
      stack,
      errorLocationCode,
    });
  }
}

class NotFoundError extends BaseError {
  constructor({
    message,
    action,
    requestId,
    errorId,
    stack,
    errorLocationCode,
    key,
  }: {
    message?: string;
    action?: string;
    requestId?: string;
    errorId?: string;
    stack?: string;
    errorLocationCode?: number;
    key?: string;
  }) {
    super({
      message: message || 'Não foi possível encontrar este recurso no sistema.',
      action:
        action ||
        'Verifique se o caminho (PATH) e o método (GET, POST, PUT, DELETE) estão corretos.',
      statusCode: 404,
      requestId,
      errorId,
      stack,
      errorLocationCode,
      key,
    });
  }
}

class ServiceError extends BaseError {
  constructor({
    message,
    action,
    stack,
    context,
    statusCode,
    errorLocationCode,
    databaseErrorCode,
  }: {
    message?: string;
    action?: string;
    stack?: string;
    context?: any;
    statusCode?: number;
    errorLocationCode?: number;
    databaseErrorCode?: string;
  }) {
    super({
      message: message || 'Serviço indisponível no momento.',
      action: action || 'Verifique se o serviço está disponível.',
      stack,
      statusCode: statusCode || 503,
      context,
      errorLocationCode,
      databaseErrorCode,
    });
  }
}

class ValidationError extends BaseError {
  constructor({
    message,
    action,
    stack,
    statusCode,
    context,
    errorLocationCode,
    key,
    type,
  }: {
    message?: string;
    action?: string;
    stack?: string;
    statusCode?: number;
    context?: any;
    errorLocationCode?: number;
    key?: string;
    type?: string;
  }) {
    super({
      message: message || 'Um erro de validação ocorreu.',
      action: action || 'Ajuste os dados enviados e tente novamente.',
      statusCode: statusCode || 400,
      stack,
      context,
      errorLocationCode,
      key,
      type,
    });
  }
}

class UnauthorizedError extends BaseError {
  constructor({
    message,
    action,
    requestId,
    stack,
    errorLocationCode,
  }: {
    message?: string;
    action?: string;
    requestId?: string;
    stack?: string;
    errorLocationCode?: number;
  }) {
    super({
      message: message || 'Usuário não autenticado.',
      action:
        action ||
        'Verifique se você está autenticado com uma sessão ativa e tente novamente.',
      requestId,
      statusCode: 401,
      stack,
      errorLocationCode,
    });
  }
}

class ForbiddenError extends BaseError {
  constructor({
    message,
    action,
    requestId,
    stack,
    errorLocationCode,
  }: {
    message?: string;
    action?: string;
    requestId?: string;
    stack?: string;
    errorLocationCode?: number;
  }) {
    super({
      message: message || 'Você não possui permissão para executar esta ação.',
      action:
        action || 'Verifique se você possui permissão para executar esta ação.',
      requestId,
      statusCode: 403,
      stack,
      errorLocationCode,
    });
  }
}

class TooManyRequestsError extends BaseError {
  constructor({
    message,
    action,
    context,
    stack,
    errorLocationCode,
  }: {
    message?: string;
    action?: string;
    context?: any;
    stack?: string;
    errorLocationCode?: number;
  }) {
    super({
      message: message || 'Você realizou muitas requisições recentemente.',
      action:
        action ||
        'Tente novamente mais tarde ou contate o suporte caso acredite que isso seja um erro.',
      statusCode: 429,
      context,
      stack,
      errorLocationCode,
    });
  }
}

class UnprocessableEntityError extends BaseError {
  constructor({
    message,
    action,
    stack,
    errorLocationCode,
  }: {
    message?: string;
    action?: string;
    stack?: string;
    errorLocationCode?: number;
  }) {
    super({
      message: message || 'Não foi possível realizar esta operação.',
      action:
        action ||
        'Os dados enviados estão corretos, porém não foi possível realizar esta operação.',
      statusCode: 422,
      stack,
      errorLocationCode,
    });
  }
}

// Define other error classes similarly...

export {
  InternalServerError,
  NotFoundError,
  ServiceError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  TooManyRequestsError,
  UnprocessableEntityError,
};