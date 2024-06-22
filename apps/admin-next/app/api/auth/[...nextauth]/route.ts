import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"

const handler = NextAuth({
    providers: [GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID || "",
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
        profile(profile) {
            return {
              id: profile.id,
            // Return all the profile information you need.
            // The only truly required field is `id`
            // to be able identify the account when added to a database
            }
        },
    })],
    callbacks: {
        async signIn({ user, account, profile, email, credentials }) {
          // Here you can handle user data before sign-in
          // Return true to allow sign-in, false to deny
          return true;
        },
        async jwt({ token, user, account, profile, isNewUser }) {
          // Initial sign in
          if (account && user) {
            token.accessToken = account.access_token;
            // Add custom claims, e.g., role:
            token.userRole = user.role;
          }
          return token;
        },
        async session({ session, token, user }) {
          // Send properties to the client, like user role
          session.user.role = token.userRole;
          return session;
        }
      }
})


export { handler as GET, handler as POST }