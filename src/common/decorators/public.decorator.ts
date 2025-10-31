import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

export const IS_SECURE_KEY = 'isSecure';
export const Secured = () => SetMetadata(IS_SECURE_KEY, true);