// src/tools/buyers/buyerTools.ts
import { z } from "zod";
import { DynamicStructuredTool } from "langchain/tools";
import { BuyerRepository } from "../../../../repo/buyersRepo";

// Define Buyer Schema
const BuyerSchema = z.object({
  code: z.string().describe("Unique code identifier for the buyer"),
  buyer_name: z.string().describe("Full name of the buyer organization"),
  contact_person: z.string().optional().nullable().describe("Primary contact person at the buyer organization"),
  email: z.string().email().optional().nullable().describe("Contact email for the buyer"),
  country: z.string().optional().nullable().describe("Country where the buyer operates"),
  adaptor_license_key: z.string().optional().nullable().describe("License key for buyer system integration"),
  web_link: z.string().url().optional().nullable().describe("URL to buyer's portal or website"),
  import_path: z.string().optional().nullable().describe("File import path for buyer documents"),
  export_path: z.string().optional().nullable().describe("File export path for buyer documents")
});

// Define Main Request Schema
const CreateBuyerRequestSchema = z.object({
  buyer: BuyerSchema.describe("Complete buyer information"),
  force_create: z.boolean().default(false).optional().describe("Force create buyer even if code already exists")
});

const description = `
Create or update a buyer in the system.

This will add a new buyer record or update an existing one with all provided details.
Required fields are code and buyer_name. All other fields are optional.

Response: Buyer details with status
`;

const createBuyerTool = new DynamicStructuredTool({
  name: "create_buyer",
  description: description,
  schema: CreateBuyerRequestSchema,
  func: async (data): Promise<string> => {
    try {
      // Check if buyer already exists
      const exists = await BuyerRepository.buyerExists(data.buyer.code);
      
      if (exists && !data.force_create) {
        return JSON.stringify({
          status: 'Exists',
          output: `Buyer with code ${data.buyer.code} already exists. Use force_create=true to update existing buyer.`,
          existing_buyer: await BuyerRepository.getBuyerByCode(data.buyer.code)
        });
      }

      // Create or update buyer
      let buyer;
      if (exists) {
        buyer = await BuyerRepository.updateBuyer(data.buyer.code, data.buyer);
      } else {
        buyer = await BuyerRepository.createBuyer(data.buyer);
      }

      return JSON.stringify({
        status: 'Success',
        output: `Buyer ${exists ? 'updated' : 'created'} successfully`,
        buyer: buyer
      });
    } catch (error: any) {
      console.error("[ERROR]", "BuyerTool::createBuyer", error);
      return JSON.stringify({
        status: 'Error',
        output: `Failed to ${data.force_create ? 'update' : 'create'} buyer: ${error.message}`,
        error_details: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  }
});

const getBuyerTool = new DynamicStructuredTool({
  name: "get_buyer",
  description: "Retrieve buyer details by buyer code",
  schema: z.object({
    code: z.string().describe("Buyer code to retrieve")
  }),
  func: async ({ code }): Promise<string> => {
    try {
      const buyer = await BuyerRepository.getBuyerByCode(code);
      if (!buyer) {
        return JSON.stringify({
          status: 'Not Found',
          output: `Buyer with code ${code} not found`
        });
      }
      return JSON.stringify({
        status: 'Success',
        buyer: buyer
      });
    } catch (error: any) {
      console.error("[ERROR]", "BuyerTool::getBuyer", error);
      return JSON.stringify({
        status: 'Error',
        output: `Failed to get buyer: ${error.message}`,
        error_details: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  }
});

const listBuyersTool = new DynamicStructuredTool({
  name: "list_buyers",
  description: "List buyers with pagination and optional filters",
  schema: z.object({
    offset: z.number().default(0).optional().describe("Pagination offset"),
    limit: z.number().default(10).optional().describe("Number of items per page"),
    filters: z.array(z.object({
      field: z.string(),
      operator: z.string(),
      value: z.any()
    })).optional().describe("Filters to apply"),
    sort_by: z.string().optional().describe("Field to sort by"),
    sort_order: z.enum(["ASC", "DESC"]).optional().describe("Sorting order")
  }),
  func: async (params): Promise<string> => {
    try {
      const { offset = 0, limit = 10, filters = [], sort_by, sort_order } = params;
      const orderBy = sort_by ? [{ column: sort_by, order: sort_order || 'ASC' }] : [];
      
      const result = await BuyerRepository.getBuyers(
        offset, 
        limit, 
        filters.map(f => ({
          columnField: f.field,
          operatorValue: f.operator,
          value: f.value
        })), 
        orderBy
      );
      
      return JSON.stringify({
        status: 'Success',
        ...result
      });
    } catch (error: any) {
      console.error("[ERROR]", "BuyerTool::listBuyers", error);
      return JSON.stringify({
        status: 'Error',
        output: `Failed to list buyers: ${error.message}`,
        error_details: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  }
});

export {
  createBuyerTool,
  getBuyerTool,
  listBuyersTool
};