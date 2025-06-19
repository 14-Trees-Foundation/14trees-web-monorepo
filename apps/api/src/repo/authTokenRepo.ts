import { Op, WhereOptions } from 'sequelize';
import { AuthToken, AuthTokenAttributes, AuthTokenCreationAttributes } from '../models/auth_token';
import { v4 as uuidv4 } from 'uuid';

// Token ID expiration time in milliseconds (1 minute)
const TOKEN_ID_EXPIRY_MS = 60 * 1000;

export class AuthTokenRepository {
  /**
   * Create a new authentication token for a user
   * @param userId The ID of the user
   * @param expiresIn Time in milliseconds until token expiration (default: 24 hours)
   * @returns The created auth token
   */
  public static async createToken(userId: number, token: string, expiresIn: number = 24 * 60 * 60 * 1000): Promise<AuthToken> {
    const expiresAt = new Date(Date.now() + expiresIn);
    
    const tokenData: AuthTokenCreationAttributes = {
      user_id: userId,
      token: token,
      expires_at: expiresAt,
      token_id_created_at: Date.now(),
      created_at: new Date(),
      updated_at: new Date()
    };
    
    return await AuthToken.create(tokenData);
  }

  /**
   * Find a token by its main token UUID
   * @param token The main token UUID to find
   * @returns The auth token or null if not found
   */
  public static async findByMainToken(token: string): Promise<AuthToken | null> {
    return await AuthToken.findOne({
      where: { token }
    });
  }

  /**
   * Find a token by its token_id
   * @param tokenId The token_id UUID to find
   * @returns The auth token or null if not found
   */
  public static async findByTokenId(tokenId: string): Promise<AuthToken | null> {
    return await AuthToken.findOne({
      where: { token_id: tokenId }
    });
  }

  /**
   * Find a valid token by its token_id (checks both main token expiry and token_id expiry)
   * @param tokenId The token_id UUID to find
   * @returns The auth token or null if not found or expired
   */
  public static async findValidTokenById(tokenId: string): Promise<AuthToken | null> {
    const token = await AuthToken.findOne({
      where: {
        token_id: tokenId,
        expires_at: {
          [Op.gt]: new Date()
        }
      }
    });

    if (!token) {
      return null;
    }

    // Check if token_id is still valid (less than 1 minute old)
    const now = Date.now();
    if (now - token.token_id_created_at > TOKEN_ID_EXPIRY_MS) {
      return null; // token_id has expired
    }

    return token;
  }

  /**
   * Refresh the token_id for an existing token
   * @param tokenOrId The token UUID or token record ID
   * @returns The updated token with new token_id or null if not found
   */
  public static async refreshTokenId(tokenOrId: string | number): Promise<AuthToken | null> {
    let token: AuthToken | null = null;
    
    if (typeof tokenOrId === 'string') {
      // Find by main token
      token = await AuthToken.findOne({
        where: { token: tokenOrId }
      });
    } else {
      // Find by ID
      token = await AuthToken.findByPk(tokenOrId);
    }
    
    if (!token) {
      return null;
    }
    
    // Check if the main token is still valid
    if (token.expires_at < new Date()) {
      return null;
    }
    
    // Generate new token_id and update timestamp
    token.token_id = uuidv4();
    token.token_id_created_at = Date.now();
    token.updated_at = new Date();
    await token.save();
    
    return token;
  }

  /**
   * Get all tokens for a specific user
   * @param userId The ID of the user
   * @returns Array of auth tokens
   */
  public static async getTokensByUserId(userId: number): Promise<AuthToken[]> {
    return await AuthToken.findAll({
      where: { user_id: userId }
    });
  }

  /**
   * Get all valid (non-expired) tokens for a specific user
   * @param userId The ID of the user
   * @returns Array of valid auth tokens
   */
  public static async getValidTokensByUserId(userId: number): Promise<AuthToken[]> {
    return await AuthToken.findAll({
      where: {
        user_id: userId,
        expires_at: {
          [Op.gt]: new Date()
        }
      }
    });
  }

  /**
   * Update a token's expiration time
   * @param tokenId The ID of the token to update
   * @param expiresAt The new expiration date
   * @returns The updated token or null if not found
   */
  public static async updateTokenExpiry(tokenId: number, expiresAt: Date): Promise<AuthToken | null> {
    const token = await AuthToken.findByPk(tokenId);
    
    if (!token) {
      return null;
    }
    
    token.expires_at = expiresAt;
    token.updated_at = new Date();
    await token.save();
    
    return token;
  }

  /**
   * Extend a token's expiration time by a specified amount
   * @param tokenId The ID of the token to extend
   * @param extensionMs Time in milliseconds to extend the token (default: 24 hours)
   * @returns The updated token or null if not found
   */
  public static async extendToken(tokenId: number, extensionMs: number = 24 * 60 * 60 * 1000): Promise<AuthToken | null> {
    const token = await AuthToken.findByPk(tokenId);
    
    if (!token) {
      return null;
    }
    
    const newExpiryDate = new Date(token.expires_at.getTime() + extensionMs);
    token.expires_at = newExpiryDate;
    token.updated_at = new Date();
    await token.save();
    
    return token;
  }

  /**
   * Delete a token by its ID
   * @param tokenId The ID of the token to delete
   * @returns Number of deleted rows (0 or 1)
   */
  public static async deleteToken(tokenId: number): Promise<number> {
    return await AuthToken.destroy({
      where: { id: tokenId }
    });
  }

  /**
   * Delete a token by its main token UUID
   * @param token The main token UUID to delete
   * @returns Number of deleted rows (0 or 1)
   */
  public static async deleteByMainToken(token: string): Promise<number> {
    return await AuthToken.destroy({
      where: { token }
    });
  }

  /**
   * Delete a token by its token_id
   * @param tokenId The token_id UUID to delete
   * @returns Number of deleted rows (0 or 1)
   */
  public static async deleteByTokenId(tokenId: string): Promise<number> {
    return await AuthToken.destroy({
      where: { token_id: tokenId }
    });
  }

  /**
   * Delete all tokens for a specific user
   * @param userId The ID of the user
   * @returns Number of deleted rows
   */
  public static async deleteAllUserTokens(userId: number): Promise<number> {
    return await AuthToken.destroy({
      where: { user_id: userId }
    });
  }

  /**
   * Delete all expired tokens
   * @returns Number of deleted rows
   */
  public static async deleteExpiredTokens(): Promise<number> {
    return await AuthToken.destroy({
      where: {
        expires_at: {
          [Op.lte]: new Date()
        }
      }
    });
  }

  /**
   * Check if a token_id is valid (exists, main token not expired, and token_id not expired)
   * @param tokenId The token_id UUID to check
   * @returns Boolean indicating if the token_id is valid
   */
  public static async isTokenIdValid(tokenId: string): Promise<boolean> {
    const token = await AuthToken.findOne({
      where: {
        token_id: tokenId,
        expires_at: {
          [Op.gt]: new Date()
        }
      }
    });
    
    if (!token) {
      return false;
    }
    
    // Check if token_id is still valid (less than 1 minute old)
    const now = Date.now();
    return (now - token.token_id_created_at <= TOKEN_ID_EXPIRY_MS);
  }

  /**
   * Check if a main token is valid (exists and not expired)
   * @param token The main token UUID to check
   * @returns Boolean indicating if the token is valid
   */
  public static async isMainTokenValid(token: string): Promise<boolean> {
    const count = await AuthToken.count({
      where: {
        token,
        expires_at: {
          [Op.gt]: new Date()
        }
      }
    });
    
    return count > 0;
  }
}