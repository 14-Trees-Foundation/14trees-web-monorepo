import { AuthTokenRepository } from '../repo/authTokenRepo';
import { AuthToken } from '../models/auth_token';

/**
 * Authentication service for managing user authentication
 */
export class AuthService {
  /**
   * Authenticate a user with a token_id
   * This function validates the token_id and returns the main token if valid
   * 
   * @param tokenId The short-lived token_id to validate
   * @returns The main token object if valid, null otherwise
   */
  public static async authenticateWithTokenId(tokenId: string): Promise<AuthToken | null> {
    // Find and validate the token_id (checks both main token expiry and token_id expiry)
    const token = await AuthTokenRepository.findValidTokenById(tokenId);
    
    if (!token) {
      return null;
    }
    
    // Return the token for further use
    return token;
  }

  /**
   * Generate a new token_id for an existing token
   * This is useful when you need to refresh the short-lived token_id
   * 
   * @param mainToken The main token UUID
   * @returns The refreshed token with new token_id or null if not found/expired
   */
  public static async refreshTokenId(mainToken: string): Promise<AuthToken | null> {
    return await AuthTokenRepository.refreshTokenId(mainToken);
  }

  /**
   * Create or update an authentication token for a user
   * If a token already exists for the user, it will be updated
   * 
   * @param userId The ID of the user
   * @param token The JWT token to store
   * @param expiresIn Time in milliseconds until token expiration (default: 24 hours)
   * @returns The created or updated auth token
   */
  public static async upsertAuthToken(userId: number, token: string, expiresIn?: number): Promise<AuthToken> {
    // Check if a token already exists for this user
    const existingTokens = await AuthTokenRepository.getValidTokensByUserId(userId);
    
    if (existingTokens.length > 0) {
      // Update the existing token
      const existingToken = existingTokens[0];
      existingToken.token = token;
      
      // Update expiration if provided
      if (expiresIn) {
        existingToken.expires_at = new Date(Date.now() + expiresIn);
      }
      
      existingToken.updated_at = new Date();
      await existingToken.save();
      
      // Generate a new token_id
      const updated = await AuthTokenRepository.refreshTokenId(existingToken.id);
      return updated || existingToken;
    }
    
    // Create a new token if none exists
    return await AuthTokenRepository.createToken(userId, token, expiresIn);
  }

  /**
   * Create a new authentication token for a user
   * This is kept for backward compatibility and calls upsertAuthToken
   * 
   * @param userId The ID of the user
   * @param token The JWT token to store
   * @param expiresIn Time in milliseconds until token expiration (default: 24 hours)
   * @returns The created auth token
   */
  public static async createAuthToken(userId: number, token: string, expiresIn?: number): Promise<AuthToken> {
    return await this.upsertAuthToken(userId, token, expiresIn);
  }

  /**
   * Invalidate a token (delete it)
   * 
   * @param mainToken The main token UUID to invalidate
   * @returns Boolean indicating success
   */
  public static async invalidateToken(mainToken: string): Promise<boolean> {
    const result = await AuthTokenRepository.deleteByMainToken(mainToken);
    return result > 0;
  }

  /**
   * Invalidate all tokens for a user (logout from all devices)
   * 
   * @param userId The ID of the user
   * @returns Number of tokens invalidated
   */
  public static async invalidateAllUserTokens(userId: number): Promise<number> {
    return await AuthTokenRepository.deleteAllUserTokens(userId);
  }

  /**
   * Clean up expired tokens
   * This should be run periodically to remove expired tokens from the database
   * 
   * @returns Number of tokens deleted
   */
  public static async cleanupExpiredTokens(): Promise<number> {
    return await AuthTokenRepository.deleteExpiredTokens();
  }
}