import { z } from "zod";
import { DynamicStructuredTool } from "langchain/tools";
import { SupplierRepository } from "../../../../repo/suppliersRepo"; 

// Define Supplier Schema
const SupplierSchema = z.object({
  code: z.string().describe("Unique code identifier for the supplier"),
  name: z.string().describe("Full name of the supplier"),
  address: z.string().optional().nullable().describe("Physical address of the supplier"),
  city: z.string().optional().nullable().describe("City where the supplier is located"),
  email: z.string().email().optional().nullable().describe("Contact email for the supplier"),
  country: z.string().optional().nullable().describe("Country where the supplier operates"),
  company_group_code: z.string().optional().nullable().describe("Group code if supplier belongs to a company group"),
  import_path: z.string().optional().nullable().describe("File import path for supplier documents"),
  export_path: z.string().optional().nullable().describe("File export path for supplier documents"),
  supplier_formats: z.array(z.string()).optional().nullable().describe("Supported formats by the supplier"),
  server: z.string().optional().nullable().describe("Server information for the supplier")
});

// Define Main Request Schema
const CreateSupplierRequestSchema = z.object({
  supplier: SupplierSchema.describe("Complete supplier information"),
  force_create: z.boolean().default(false).optional().describe("Force create supplier even if code already exists")
});

const description = `
Create a new supplier in the system. 

This will add a new supplier record to the database with all the provided details.
Required fields are code and name. All other fields are optional.

Response: Supplier details with status
`;

const createSupplierTool = new DynamicStructuredTool({
  name: "create_supplier",
  description: description,
  schema: CreateSupplierRequestSchema,
  func: async (data: { supplier: any; force_create?: boolean }): Promise<string> => {
    try {
      // Check if supplier already exists
      const exists = await SupplierRepository.supplierExists(data.supplier.code);
      
      if (exists && !data.force_create) {
        return JSON.stringify({
          status: 'Exists',
          output: `Supplier with code ${data.supplier.code} already exists. Use force_create=true to update existing supplier.`,
          existing_supplier: await SupplierRepository.getSupplierByCode(data.supplier.code)
        });
      }

      // Create or update supplier
      let supplier;
      if (exists) {
        supplier = await SupplierRepository.updateSupplier(data.supplier.code, data.supplier);
      } else {
        supplier = await SupplierRepository.createSupplier(data.supplier);
      }

      return JSON.stringify({
        status: 'Success',
        output: `Supplier ${exists ? 'updated' : 'created'} successfully`,
        supplier: supplier
      });
    } catch (error: any) {
      console.error("[ERROR]", "SupplierTool::createSupplier", error);
      return JSON.stringify({
        status: 'Error',
        output: `Failed to ${data.force_create ? 'update' : 'create'} supplier: ${error.message}`,
        error_details: error
      });
    }
  }
});

// Additional tools for other CRUD operations
const getSupplierTool = new DynamicStructuredTool({
  name: "get_supplier",
  description: "Retrieve supplier details by supplier code",
  schema: z.object({
    code: z.string().describe("Supplier code to retrieve")
  }),
  func: async ({ code }: { code: string }): Promise<string> => {
    try {
      const supplier = await SupplierRepository.getSupplierByCode(code);
      if (!supplier) {
        return JSON.stringify({
          status: 'Not Found',
          output: `Supplier with code ${code} not found`
        });
      }
      return JSON.stringify({
        status: 'Success',
        supplier: supplier
      });
    } catch (error: any) {
      console.error("[ERROR]", "SupplierTool::getSupplier", error);
      throw new Error(`Failed to get supplier: ${error.message}`);
    }
  }
});

const listSuppliersTool = new DynamicStructuredTool({
  name: "list_suppliers",
  description: "List suppliers with pagination and optional filters",
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
  func: async (params: { offset?: number; limit?: number; filters?: any[]; sort_by?: string; sort_order?: "ASC" | "DESC" }): Promise<string> => {
    try {
      const { offset = 0, limit = 10, filters = [], sort_by, sort_order } = params;
      const orderBy = sort_by ? [{ column: sort_by, order: sort_order || 'ASC' }] : [];
      
      const result = await SupplierRepository.getSuppliers(
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
      console.error("[ERROR]", "SupplierTool::listSuppliers", error);
      throw new Error(`Failed to list suppliers: ${error.message}`);
    }
  }
});

export {
  createSupplierTool,
  getSupplierTool,
  listSuppliersTool
};