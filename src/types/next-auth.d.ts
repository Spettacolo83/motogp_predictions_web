import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: string;
      nickname?: string | null;
      isEmailVerified: boolean;
      isCredentials: boolean;
    };
  }

  interface User {
    role?: string;
    nickname?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: string;
    nickname?: string | null;
    isEmailVerified?: boolean;
    isCredentials?: boolean;
  }
}
