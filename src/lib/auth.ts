import { PrismaAdapter } from "@auth/prisma-adapter";
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { compare } from "bcryptjs";
import { JWT } from "next-auth/jwt";

async function refreshAccessToken(token: JWT) {
  try {
    const response = await fetch("https://oauth2.googleapis.com/token", {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        grant_type: "refresh_token",
        refresh_token: token.refreshToken as string,
      }),
      method: "POST",
    });

    const refreshedTokens = await response.json();

    if (!response.ok) {
      throw refreshedTokens;
    }

    return {
      ...token,
      accessToken: refreshedTokens.access_token,
      accessTokenExpires: Date.now() + refreshedTokens.expires_in * 1000,
      refreshToken: refreshedTokens.refresh_token ?? token.refreshToken,
    };
  } catch (error) {
    return {
      ...token,
      error: "RefreshAccessTokenError",
    };
  }
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            console.log("Missing credentials");
            return null;
          }

          console.log("Looking up user:", credentials.email);
          const user = await prisma.user.findUnique({
            where: {
              email: credentials.email,
            },
            include: {
              userRoles: {
                include: {
                  role: true,
                },
              },
            },
          });

          if (!user) {
            console.log("User not found:", credentials.email);
            return null;
          }

          console.log("Checking password for user:", user.email);
          const isPasswordValid = await compare(credentials.password, user.password);

          if (!isPasswordValid) {
            console.log("Invalid password for user:", user.email);
            return null;
          }

          // Get the user's role
          const userRole = user.userRoles?.[0]?.role?.name || 'User';
          console.log("User authenticated successfully:", {
            email: user.email,
            role: userRole,
            roles: user.userRoles,
          });

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
            roles: user.userRoles,
            role: userRole,
          };
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        console.log("Setting JWT token:", { user });
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.picture = user.image;
        token.role = user.role;
      }

      // Refresh token rotation
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.accessTokenExpires = account.expires_at * 1000;
      }

      // Return previous token if the access token has not expired
      const shouldRefreshTime = Math.round((token.accessTokenExpires as number) - Date.now());
      if (shouldRefreshTime > 0) {
        return token;
      }

      // Access token has expired, refresh it
      return await refreshAccessToken(token);
    },
    async session({ session, token }) {
      if (token) {
        console.log("Setting session:", { token });
        session.user.id = token.id;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.image = token.picture;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
  debug: true, // Enable debug logs
};
