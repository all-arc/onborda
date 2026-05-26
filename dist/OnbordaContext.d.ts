import React from "react";
import { OnbordaContextType } from "./types/index.js";
declare const useOnborda: () => OnbordaContextType;
declare const OnbordaProvider: React.FC<{
    children: React.ReactNode;
}>;
export { OnbordaProvider, useOnborda };
