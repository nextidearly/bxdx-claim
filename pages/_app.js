import "@/styles/globals.css";
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap/dist/css/bootstrap.min.css";
import { WalletStandardProvider } from "@wallet-standard/react";

export default function App({ Component, pageProps }) {
  return (
    <WalletStandardProvider>
      <Component {...pageProps} />
    </WalletStandardProvider>
  );
}
