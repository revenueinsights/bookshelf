// types/next-auth.d.ts
import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  /**
   * Extend the built-in session types
   */
  interface Session {
    user?: {
      id?: string;
    } & DefaultSession['user'];
  }

  /**
   * Extend the built-in user types
   */
  interface User {
    id: string;
  }
}

declare module 'next-auth/jwt' {
  /**
   * Extend the JWT (JSON Web Token) types
   */
  interface JWT {
    id?: string;
  }
}