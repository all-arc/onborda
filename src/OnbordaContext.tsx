"use client";
import React, { createContext, useContext, useState, useCallback, useMemo } from "react";

// Types
import { OnbordaContextType } from "./types";

// Example Hooks Usage:
// const { setCurrentStep, closeOnborda, startOnborda } = useOnborda();

// // To trigger a specific step
// setCurrentStep(2); // step 3

// // To close/start onboarding
// closeOnborda();
// startOnborda();

const OnbordaContext = createContext<OnbordaContextType | undefined>(undefined);

const useOnborda = () => {
  const context = useContext(OnbordaContext);
  if (context === undefined) {
    throw new Error("useOnborda must be used within an OnbordaProvider");
  }
  return context;
};

const OnbordaProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [currentTour, setCurrentTour] = useState<string | null>(null);
  const [currentStep, setCurrentStepState] = useState(0);
  const [isOnbordaVisible, setOnbordaVisible] = useState(false);

  const setCurrentStep = useCallback((step: number, delay?: number) => {
    if (delay) {
      setTimeout(() => {
        setCurrentStepState(step);
        setOnbordaVisible(true);
      }, delay);
    } else {
      setCurrentStepState(step);
      setOnbordaVisible(true);
    }
  }, []);

  const closeOnborda = useCallback(() => {
    setOnbordaVisible(false);
    setCurrentTour(null);
  }, []);

  const startOnborda = useCallback((tourName: string) => {
    setCurrentTour(tourName);
    setCurrentStepState(0);
    setOnbordaVisible(true);
  }, []);

  const contextValue = useMemo(
    () => ({
      currentTour,
      currentStep,
      setCurrentStep,
      closeOnborda,
      startOnborda,
      isOnbordaVisible,
    }),
    [
      closeOnborda,
      currentStep,
      currentTour,
      isOnbordaVisible,
      setCurrentStep,
      startOnborda,
    ]
  );

  return (
    <OnbordaContext.Provider value={contextValue}>
      {children}
    </OnbordaContext.Provider>
  );
};

export { OnbordaProvider, useOnborda };
