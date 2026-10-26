import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const verifyOtpSchema = z.object({
  email: z.string().email('Invalid email address'),
  otp: z.string().length(6, 'OTP must be exactly 6 digits'),
});

export class VerifyOtpDto extends createZodDto(verifyOtpSchema) {}
