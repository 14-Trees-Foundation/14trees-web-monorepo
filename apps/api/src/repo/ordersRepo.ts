import { QueryTypes } from 'sequelize';
import { Order, OrderAttributes, OrderCreationAttributes } from '../models/order'; // Import your Sequelize model for Order
import { getSqlQueryExpression } from '../controllers/helper/filters';
import { FilterItem, PaginatedResponse } from '../models/pagination';
import { sequelize } from '../config/postgreDB';
import { getSchema } from '../helpers/utils';

export class OrderRepository {
    static async getOrders(offset: number, limit: number, filters?: FilterItem[]): Promise<PaginatedResponse<Order>> {
        let whereConditions: string = "";
        let replacements: any = {}

        if (filters && filters.length > 0) {
            filters.forEach(filter => {
                let columnField = "o." + filter.columnField
                if (filter.columnField === "user_name") {
                    columnField = "u.name"
                } else if (filter.columnField === "group_name") {
                    columnField = "g.name"
                }
                const { condition, replacement } = getSqlQueryExpression(columnField, filter.operatorValue, filter.columnField, filter.value);
                whereConditions = whereConditions + " " + condition + " AND";
                replacements = { ...replacements, ...replacement }
            })
            whereConditions = whereConditions.substring(0, whereConditions.length - 3);
        }

        const getQuery = `
            SELECT o.*, u.name as user_name, u.email as user_email, u.phone as user_phone, g.name as group_name
            FROM "${getSchema()}".orders o
            LEFT JOIN "${getSchema()}".users u ON u.id = o.user_id
            LEFT JOIN "${getSchema()}".groups g ON g.id = o.group_id
            WHERE ${whereConditions !== "" ? whereConditions : "1=1"}
            ORDER BY o.id DESC ${limit === -1 ? "" : `LIMIT ${limit} OFFSET ${offset}`};
        `

        const countQuery = `
            SELECT COUNT(*) 
            FROM "${getSchema()}".orders o
            LEFT JOIN "${getSchema()}".users u ON u.id = o.user_id
            LEFT JOIN "${getSchema()}".groups g ON g.id = o.group_id
            WHERE ${whereConditions !== "" ? whereConditions : "1=1"};
        `

        const orders: any[] = await sequelize.query(getQuery, {
            replacements: replacements,
            type: QueryTypes.SELECT
        })

        const countGiftCards: any = await sequelize.query(countQuery, {
            replacements: replacements,
            type: QueryTypes.SELECT
        })
        const totalResults = parseInt(countGiftCards[0].count)

        return {
            offset: offset,
            total: totalResults,
            results: orders
        };
    }

    static async createOrder(data: OrderCreationAttributes): Promise<Order> {
        data.created_at = data.updated_at = new Date();
        return await Order.create(data);;
    }

    static async updateOrder(orderData: OrderAttributes): Promise<Order> {
        const order = await Order.findByPk(orderData.id);
        if (!order) {
            throw new Error('Order not found for given id');
        }

        const updatedOrder = order.update(orderData);
        return updatedOrder;
    }

    static async deleteOrder(orderId: string): Promise<number> {
        const response = await Order.destroy({ where: { id: orderId } });
        return response;
    }
}
