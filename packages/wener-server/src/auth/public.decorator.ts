import { SetMetadata } from '@nestjs/common';

export const AUTH_PUBLIC_KEY = 'auth.public';
export const Public = () => SetMetadata(AUTH_PUBLIC_KEY, true);
