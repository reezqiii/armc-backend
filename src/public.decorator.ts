import { SetMetadata } from "@nestjs/common";

// Definisikan dan ekspor constant ini
export const IS_PUBLIC_KEY = "isPublic";

// Gunakan constant tersebut di sini
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
