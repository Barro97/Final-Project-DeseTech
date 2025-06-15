import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn() {
      // We'll handle the actual user creation in our backend
      return true;
    },
    async jwt({ token, account, user }) {
      // Store OAuth data in the token for backend processing
      if (account && user && user.email && user.name) {
        token.oauth = {
          provider: account.provider,
          provider_id: account.providerAccountId,
          email: user.email,
          name: user.name,
          picture: user.image || undefined,
        };
      }
      return token;
    },
    async session({ session, token }) {
      // Pass OAuth data to session
      if (token.oauth) {
        session.oauth = token.oauth;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login", // Redirect to our custom login page
  },
  session: {
    strategy: "jwt",
  },
};
