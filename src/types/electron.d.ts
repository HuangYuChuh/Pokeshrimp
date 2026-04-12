interface PokeshrimpBridge {
  platform: string;
  auth?: {
    openBrowser?: (url: string) => Promise<void>;
  };
}

interface Window {
  pokeshrimp?: PokeshrimpBridge;
}
