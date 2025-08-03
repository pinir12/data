import '../src/app/globals.css';
import Head from 'next/head';
import { SessionProvider, useSession } from 'next-auth/react';


export default function App({ Component, pageProps: { ...pageProps }, router }) {
 
  return (
    <>
  
     <SessionProvider>
      <Component {...pageProps} />
 
      </SessionProvider>
    </>
  );
}
