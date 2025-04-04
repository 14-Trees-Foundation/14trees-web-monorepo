import { Model, ModelStatic, WhereOptions } from "sequelize";

export abstract class Repository<T extends Model> {
  constructor(protected model: ModelStatic<T>) {}

  async findAll(): Promise<T[]> {
    return this.model.findAll();
  }

  async findOne(options: any = {}): Promise<T | null> {
    return this.model.findOne(options);
  }

  async findById(id: number): Promise<T | null> {
    return this.model.findByPk(id);
  }

  async create(data: Partial<T>): Promise<T> {
    return this.model.create(data as any);
  }

  async update(id: number, data: Partial<T>): Promise<T> {
    const [_, [updated]] = await this.model.update(data, {
      where: { id: id } as unknown as WhereOptions<T>,
      returning: true,
    });
    return updated;
  }

  async delete(id: number): Promise<void> {
    await this.model.destroy({
      where: { id: id } as unknown as WhereOptions<T>,
    });
  }
} 