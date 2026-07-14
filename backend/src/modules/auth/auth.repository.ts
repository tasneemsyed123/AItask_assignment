/**
 * modules/auth/auth.repository.ts
 * --------------------------------------------------------------------------
 * Repository pattern: the ONLY place in the codebase that talks to
 * Mongoose for User documents. auth.service.ts depends on this interface,
 * not on Mongoose directly - so the service is unit-testable with an
 * in-memory fake repository, and swapping the persistence layer later
 * only touches this one file.
 */
import { UserModel, UserDocument } from '../../models/User.model';

export class AuthRepository {
  async findByEmail(email: string): Promise<UserDocument | null> {
    return UserModel.findOne({ email }).select('+passwordHash');
  }

  async findById(id: string): Promise<UserDocument | null> {
    return UserModel.findById(id);
  }

  async create(data: { name: string; email: string; passwordHash: string }): Promise<UserDocument> {
    return UserModel.create(data);
  }

  async setResetToken(userId: string, tokenHash: string, expires: Date): Promise<void> {
    await UserModel.updateOne(
      { _id: userId },
      { resetPasswordTokenHash: tokenHash, resetPasswordExpires: expires },
    );
  }

  /**
   * Finds a user by email whose stored reset token hash matches and whose
   * expiry has not passed. Must explicitly .select() the normally-hidden
   * fields since they use `select: false` on the schema.
   */
  async findByEmailWithValidResetToken(email: string, tokenHash: string): Promise<UserDocument | null> {
    return UserModel.findOne({
      email,
      resetPasswordTokenHash: tokenHash,
      resetPasswordExpires: { $gt: new Date() },
    }).select('+passwordHash +resetPasswordTokenHash +resetPasswordExpires');
  }

  async updatePasswordAndClearResetToken(userId: string, passwordHash: string): Promise<void> {
    await UserModel.updateOne(
      { _id: userId },
      { passwordHash, resetPasswordTokenHash: null, resetPasswordExpires: null },
    );
  }
}
