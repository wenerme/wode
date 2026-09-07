import { z } from 'zod/v4';

export const JsonDateSchema = z.iso.date({ error: '错误的日期' }).meta({ format: 'date', type: 'string' });
