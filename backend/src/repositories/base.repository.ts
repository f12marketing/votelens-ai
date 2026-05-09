import logger from '../utils/logger';

export abstract class BaseRepository<T> {
  protected model: any;

  constructor(model: any) {
    this.model = model;
  }

  protected logInfo(message: string, meta?: any) {
    logger.info(message, meta);
  }

  protected logError(message: string, meta?: any) {
    logger.error(message, meta);
  }

  protected async findAll(options?: any): Promise<T[]> {
    try {
      return await this.model.findMany(options);
    } catch (error) {
      this.logError('Error finding all records', error);
      throw error;
    }
  }

  protected async findById(id: string): Promise<T | null> {
    try {
      return await this.model.findUnique({ where: { id } });
    } catch (error) {
      this.logError(`Error finding record with id ${id}`, error);
      throw error;
    }
  }

  protected async create(data: any): Promise<T> {
    try {
      return await this.model.create({ data });
    } catch (error) {
      this.logError('Error creating record', error);
      throw error;
    }
  }

  protected async update(id: string, data: any): Promise<T> {
    try {
      return await this.model.update({ where: { id }, data });
    } catch (error) {
      this.logError(`Error updating record with id ${id}`, error);
      throw error;
    }
  }

  protected async delete(id: string): Promise<T> {
    try {
      return await this.model.delete({ where: { id } });
    } catch (error) {
      this.logError(`Error deleting record with id ${id}`, error);
      throw error;
    }
  }

  protected async count(options?: any): Promise<number> {
    try {
      return await this.model.count(options);
    } catch (error) {
      this.logError('Error counting records', error);
      throw error;
    }
  }

  protected async paginate(
    options: any,
    page: number = 1,
    limit: number = 10
  ): Promise<{ items: T[]; pagination: any }> {
    try {
      const skip = (page - 1) * limit;
      const [items, total] = await Promise.all([
        this.model.findMany({ ...options, skip, take: limit }),
        this.model.count(options),
      ]);

      return {
        items,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      this.logError('Error paginating records', error);
      throw error;
    }
  }
}
