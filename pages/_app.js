import '../src/app/globals.css';
import { Analytics } from "@vercel/analytics/react";
import { SessionProvider, useSession } from 'next-auth/react';


export default function App({ Component, pageProps: { ...pageProps }, router }) {
 
  return (
    <>
     <SessionProvider>
      <Component {...pageProps} />
      <Analytics />
      </SessionProvider>
    </>
  );
}
