import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const resendOtpSchema = z.object({
  email: z.string().email('Invalid email address'),
  type: z.enum(['ACCOUNT_VERIFICATION', 'PASSWORD_RESET']),
});

export class ResendOtpDto extends createZodDto(resendOtpSchema) {}
