/**
 * Password Reset Flow (Email-based)
 * 
 * TODO: Implement these features
 * 
 * 1. Request Password Reset
 *    POST /api/auth/forgot-password
 *    - Generate reset token (crypto.randomBytes)
 *    - Store in DB with expiration (15 minutes)
 *    - Send email with reset link
 * 
 * 2. Reset Password
 *    POST /api/auth/reset-password/:token
 *    - Verify token and expiration
 *    - Hash new password
 *    - Update user password
 *    - Invalidate token
 * 
 * 3. Change Password (Logged In)
 *    POST /api/auth/change-password
 *    - Verify current password
 *    - Update to new password
 * 
 * Required packages:
 * - nodemailer (for sending emails)
 * - crypto (built-in, for generating tokens)
 * 
 * Add to User model:
 *   resetPasswordToken: String,
 *   resetPasswordExpires: Date
 */

import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';

/**
 * Generate password reset token
 */
export async function generateResetToken(email) {
  const user = await User.findOne({ email });
  if (!user) {
    throw new Error('User not found');
  }

  // Generate token
  const resetToken = crypto.randomBytes(32).toString('hex');
  
  // Hash token before storing
  const hashedToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  
  // Store hashed token and expiration (15 minutes)
  user.resetPasswordToken = hashedToken;
  user.resetPasswordExpires = Date.now() + 15 * 60 * 1000;
  await user.save();
  
  return resetToken; // Send this in email
}

/**
 * Verify reset token and update password
 */
export async function resetPassword(token, newPassword) {
  // Hash the token to compare with stored hash
  const hashedToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');
  
  // Find user with valid token
  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: Date.now() }
  });
  
  if (!user) {
    throw new Error('Invalid or expired reset token');
  }
  
  // Update password
  user.password = await bcrypt.hash(newPassword, 10);
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();
  
  return user;
}

export default {
  generateResetToken,
  resetPassword
};
