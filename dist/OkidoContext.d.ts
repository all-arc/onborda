import React from "react";
import { OkidoContextType, OkidoProviderProps } from "./types/index.js";
declare const useOkido: () => OkidoContextType;
declare const OkidoProvider: React.FC<OkidoProviderProps>;
export { OkidoProvider, useOkido };
