import Head from "next/head";
import "../styles/globals.css";
import { UserProvider } from "@auth0/nextjs-auth0/client";
import { config } from "@fortawesome/fontawesome-svg-core";
import "@fortawesome/fontawesome-svg-core/styles.css"
import { Inconsolata, Barlow_Semi_Condensed, Robo } from "next/font/google"
config.autoAddCss = false;

const outfit = Inconsolata({
  subsets: ['latin'],
  variable: '--font-outfit',
  weight: '500'
})

function App({ Component, pageProps }) {
  return (
    <UserProvider>
      <Head>
        <link rel="icon" href="/favicon.png" />
      </Head>
      <main className={`${outfit.variable} font-body`}>
        <Component {...pageProps} />
      </main>
    </UserProvider>
  );
}


export default App;
