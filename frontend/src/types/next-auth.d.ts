import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    oauth?: {
      provider: string;
      provider_id: string;
      email: string;
      name: string;
      picture?: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    oauth?: {
      provider: string;
      provider_id: string;
      email: string;
      name: string;
      picture?: string;
    };
  }
}
