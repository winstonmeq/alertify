import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";

import prisma from "@/lib/prisma";

 
export const auth = betterAuth({
    database: prismaAdapter(prisma, {
      provider: "mongodb"
    }),


    emailAndPassword: {
      enabled: true,
      autoSignIn: true 
      // requireEmailVerification: true,
      // sendResetPassword: async ({ user, url }) => {
      //   await sendEmail({
      //     to: user.email,
      //     subject: "Reset your password",
      //     text: `Click the link to reset your password: ${url}`,
      //   });
      // },
    },

})


