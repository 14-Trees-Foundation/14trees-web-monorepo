import { Model, ModelStatic } from "sequelize";

export abstract class Repository<T extends Model> {
  protected model: ModelStatic<T>;

  constructor(model: ModelStatic<T>) {
    this.model = model;
  }

  async findAll(options: any = {}): Promise<T[]> {
    return this.model.findAll(options);
  }

  async findOne(options: any = {}): Promise<T | null> {
    return this.model.findOne(options);
  }

  async findById(id: string | number): Promise<T | null> {
    return this.model.findByPk(id);
  }

  async create(data: any): Promise<T> {
    return this.model.create(data);
  }

  async update(id: string | number, data: any): Promise<[number, T[]]> {
    return this.model.update(data, {
      where: { id },
      returning: true,
    });
  }

  async delete(id: string | number): Promise<number> {
    return this.model.destroy({
      where: { id },
    });
  }
} 