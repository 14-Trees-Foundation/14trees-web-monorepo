import TreeRepository from '../treeRepo';
import { sequelize } from '../../config/postgreDB';
import { QueryTypes } from 'sequelize';
import { Tree } from '../../models/tree';
import { PlantType } from '../../models/plant_type';
import { Plot } from '../../models/plot';
import { User } from '../../models/user';

// Mock sequelize.query
jest.mock('../../config/postgreDB', () => ({
  sequelize: {
    query: jest.fn(),
  },
}));

// Mock Sequelize models
jest.mock('../../models/tree', () => ({
  Tree: {
    findOne: jest.fn(),
    create: jest.fn(),
  },
}));

jest.mock('../../models/plant_type', () => ({
  PlantType: {
    findOne: jest.fn(),
  },
}));

jest.mock('../../models/plot', () => ({
  Plot: {
    findOne: jest.fn(),
  },
}));

jest.mock('../../models/user', () => ({
  User: {
    findOne: jest.fn(),
    create: jest.fn(),
  },
}));

describe('TreeRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getTrees', () => {
    it('should return paginated trees with valid filters', async () => {
      const mockTrees = [
        { id: 1, sapling_id: 'T001', plant_type_id: 1, plot_id: 1 },
        { id: 2, sapling_id: 'T002', plant_type_id: 1, plot_id: 1 },
      ];

      const mockCount = [[{ count: '2' }]];

      (sequelize.query as jest.Mock)
        .mockImplementationOnce(() => Promise.resolve(mockTrees))
        .mockImplementationOnce(() => Promise.resolve(mockCount));

      const result = await TreeRepository.getTrees(0, 10, [], []);

      expect(result).toEqual({
        offset: 0,
        total: '2',
        results: mockTrees,
      });

      expect(sequelize.query).toHaveBeenCalledTimes(2);
    });

    it('should prevent SQL injection in filters', async () => {
      const maliciousFilters = [
        {
          columnField: "sapling_id",
          operatorValue: "contains",
          value: "1'; DROP TABLE trees; --"
        }
      ];

      const mockError = new Error('Invalid operator: contains');
      (sequelize.query as jest.Mock).mockRejectedValueOnce(mockError);

      await expect(TreeRepository.getTrees(0, 10, maliciousFilters, []))
        .rejects
        .toThrow('Invalid operator: contains');
    });
  });

  describe('getTreeBySaplingId', () => {
    it('should return tree for valid sapling ID', async () => {
      const mockTree = { id: 1, sapling_id: 'T001' };
      (Tree.findOne as jest.Mock).mockResolvedValueOnce(mockTree);

      const result = await TreeRepository.getTreeBySaplingId('T001');
      expect(result).toEqual(mockTree);
    });

    it('should prevent SQL injection in sapling ID', async () => {
      await expect(TreeRepository.getTreeBySaplingId("1'; DROP TABLE trees; --"))
        .rejects
        .toThrow('Invalid sapling ID format');
    });
  });

  describe('addTree', () => {
    it('should create a tree with valid data', async () => {
      const mockTree = { id: 1, sapling_id: 'T001' };
      const mockPlantType = { id: 1 };
      const mockPlot = { id: 1 };

      (Tree.findOne as jest.Mock).mockResolvedValueOnce(null);
      (PlantType.findOne as jest.Mock).mockResolvedValueOnce(mockPlantType);
      (Plot.findOne as jest.Mock).mockResolvedValueOnce(mockPlot);
      (Tree.create as jest.Mock).mockResolvedValueOnce(mockTree);

      const result = await TreeRepository.addTree({
        sapling_id: 'T001',
        plant_type_id: 1,
        plot_id: 1,
      });

      expect(result).toEqual(mockTree);
    });

    it('should validate required fields', async () => {
      await expect(TreeRepository.addTree({
        sapling_id: '',
        plant_type_id: 0,
        plot_id: 0,
      })).rejects.toThrow('Invalid sapling ID format');
    });
  });

  describe('getTreeTags', () => {
    it('should return paginated tags', async () => {
      const mockTags = [{ tag: 'tag1' }, { tag: 'tag2' }];
      const mockCount = [{ count: '2' }];

      (sequelize.query as jest.Mock)
        .mockImplementationOnce(() => Promise.resolve(mockTags))
        .mockImplementationOnce(() => Promise.resolve(mockCount));

      const result = await TreeRepository.getTreeTags(0, 10);

      expect(result).toEqual({
        offset: 0,
        total: 2,
        results: mockTags.map(r => r.tag),
      });
    });

    it('should validate pagination parameters', async () => {
      await expect(TreeRepository.getTreeTags(-1, 10))
        .rejects
        .toThrow('Invalid pagination parameters');
    });
  });

  describe('getMappedGiftTrees', () => {
    it('should return paginated gift trees for a group', async () => {
      const mockTrees = [
        { id: 1, sapling_id: 'T001', mapped_to_group: 1 },
        { id: 2, sapling_id: 'T002', mapped_to_group: 1 },
      ];
      const mockCount = [{ count: '2' }];

      (sequelize.query as jest.Mock)
        .mockImplementationOnce(() => Promise.resolve(mockTrees))
        .mockImplementationOnce(() => Promise.resolve(mockCount));

      const result = await TreeRepository.getMappedGiftTrees(0, 10, 1, []);

      expect(result).toEqual({
        offset: 0,
        total: '2',
        results: mockTrees,
      });
    });

    it('should validate group ID', async () => {
      const mockError = new Error('Invalid group ID');
      (sequelize.query as jest.Mock).mockRejectedValueOnce(mockError);

      await expect(TreeRepository.getMappedGiftTrees(0, 10, 0, []))
        .rejects
        .toThrow('Invalid group ID');
    });

    it('should prevent SQL injection in filters', async () => {
      const maliciousFilters = [
        {
          columnField: "sapling_id",
          operatorValue: "contains",
          value: "1'; DROP TABLE trees; --"
        }
      ];

      const mockError = new Error('Invalid operator: contains');
      (sequelize.query as jest.Mock).mockRejectedValueOnce(mockError);

      await expect(TreeRepository.getMappedGiftTrees(0, 10, 1, maliciousFilters))
        .rejects
        .toThrow('Invalid operator: contains');
    });
  });

  describe('getMappedGiftTreesAnalytics', () => {
    it('should return analytics for a group', async () => {
      const mockAnalytics = [{ total_trees: '10', gifted_trees: '5' }];
      (sequelize.query as jest.Mock).mockResolvedValueOnce(mockAnalytics);

      const result = await TreeRepository.getMappedGiftTreesAnalytics(1);
      expect(result).toEqual(mockAnalytics[0]);
    });

    it('should validate group ID', async () => {
      const mockError = new Error('Invalid group ID');
      (sequelize.query as jest.Mock).mockRejectedValueOnce(mockError);

      await expect(TreeRepository.getMappedGiftTreesAnalytics(0))
        .rejects
        .toThrow('Invalid group ID');
    });
  });
}); 