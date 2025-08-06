import '../src/app/globals.css';
import Head from 'next/head';
import { SessionProvider, useSession } from 'next-auth/react';


export default function App({ Component, pageProps: { ...pageProps }, router }) {

  return (
    <>
      <Head>
        <link rel="icon" type="image/x-icon" href="/assets/favicon.png" />
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <SessionProvider>
        <Component {...pageProps} />

      </SessionProvider>
    </>
  );
}
