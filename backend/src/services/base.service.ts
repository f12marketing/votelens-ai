import logger from '../utils/logger';

export abstract class BaseService {
  protected logInfo(message: string, meta?: any) {
    logger.info(message, meta);
  }

  protected logError(message: string, meta?: any) {
    logger.error(message, meta);
  }

  protected logWarn(message: string, meta?: any) {
    logger.warn(message, meta);
  }

  protected logDebug(message: string, meta?: any) {
    logger.debug(message, meta);
  }

  protected async asyncWrapper<T>(
    fn: () => Promise<T>,
    errorMessage: string = 'An error occurred'
  ): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      this.logError(errorMessage, error);
      throw error;
    }
  }
}
