import path from 'path';
import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform((value) => Number(value)).default('4000'),
  DATABASE_URL: z.string().default('file:../prisma/dev.db'),
  WHATSAPP_TOKEN: z.string().min(1, 'WHATSAPP_TOKEN is required'),
  WHATSAPP_PHONE_ID: z.string().min(1, 'WHATSAPP_PHONE_ID is required'),
  OPENAI_API_KEY: z.string().min(1, 'OPENAI_API_KEY is required'),
  OPENAI_MODEL: z.string().default('gpt-4o-mini'),
  WHATSAPP_VERIFY_TOKEN: z.string().default(''),
});

type Env = z.infer<typeof envSchema>;

const env = envSchema.parse(process.env);

export type { Env };
export default env;
