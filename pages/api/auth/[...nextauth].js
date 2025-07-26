import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { createClient } from '@supabase/supabase-js';



const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);


const success_log = async (email, success) => {
  await supabase
    .from('download_users')
    .update({
      last_login: new Date(),
      success: success,
    })
    .match({ email: email });
};


export default NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,

  callbacks: {
    async signIn({ user, account, profile, email, credentials }) {
      // Fetch user role from Supabase
      const { data, error } = await supabase
        .from('download_users') // Replace 'users' with your user table name
        .select('role, is_active')
        .eq('email', user.email)
        .single();
console.log(data)
      if (!data) {
        return '/download?error=656';
      } else {
        if (data && data.is_active === true) {
          await success_log(user.email, true);
          // Store the role in the user object
          user.role = data.role;
          user.isAdmin = data.role === 'admin';
             return true;
        } else {
          if (data && data.is_active === false) {
            await fail_log(user.name, user.image, user.email, 'user not active');
            await success_log(user.email, false);
            return '/download?error=655';
          }
        }
      }
    },

    async jwt({ token, user, account, profile, isNewUser }) {
      // If the user object has the role, use it
      if (user && user.role) {
        token.role = user.role;
        token.isAdmin = user.isAdmin;
        token.summary_range = user.summary_range;
        return token;

      }
      return token;
    },



    async session({ session, token }) {




      if (session.user) {
        session.user.role = token.role;
        session.user.isAdmin = token.isAdmin;
        session.user.summary_range = token.summary_range;
      }



      return session;
    }

  },
});

