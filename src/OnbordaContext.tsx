"use client";
import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useRef,
  useEffect,
} from "react";

// Types
import {
  OnbordaContextType,
  OnbordaPersistedProgress,
  OnbordaProgressPersistence,
  OnbordaProgressStorage,
  OnbordaProviderProps,
  OnbordaState,
  Tour,
} from "./types/index.js";

const OnbordaContext = createContext<OnbordaContextType | undefined>(undefined);

const useOnborda = () => {
  const context = useContext(OnbordaContext);
  if (context === undefined) {
    throw new Error("useOnborda must be used within an OnbordaProvider");
  }
  return context;
};

const hasStateKey = (patch: Partial<OnbordaState>, key: keyof OnbordaState) =>
  Object.prototype.hasOwnProperty.call(patch, key);

const upsertTours = (currentTours: Tour[], nextTours: Tour[]) => {
  const tourMap = new Map(currentTours.map((tour) => [tour.tour, tour]));
  nextTours.forEach((tour) => {
    tourMap.set(tour.tour, tour);
  });
  return Array.from(tourMap.values());
};

const defaultProgressStorageKey = "onborda:progress";

const getBrowserStorage = (): OnbordaProgressStorage | null => {
  if (typeof window === "undefined" || !window.localStorage) return null;
  return window.localStorage;
};

const getProgressPersistenceConfig = (
  progressPersistence: OnbordaProgressPersistence | undefined
) => {
  if (!progressPersistence) {
    return {
      enabled: false,
      storageKey: defaultProgressStorageKey,
      storage: null,
      restore: true,
    };
  }

  if (progressPersistence === true) {
    return {
      enabled: true,
      storageKey: defaultProgressStorageKey,
      storage: getBrowserStorage(),
      restore: true,
    };
  }

  return {
    enabled: true,
    storageKey: progressPersistence.storageKey ?? defaultProgressStorageKey,
    storage: progressPersistence.storage ?? getBrowserStorage(),
    restore: progressPersistence.restore ?? true,
  };
};

const parsePersistedProgress = (
  value: string | null
): OnbordaPersistedProgress | null => {
  if (!value) return null;

  try {
    const parsed = JSON.parse(value) as Partial<OnbordaPersistedProgress>;
    if (parsed.version !== 1) return null;
    if (
      parsed.currentTour !== null &&
      typeof parsed.currentTour !== "string"
    ) {
      return null;
    }
    if (typeof parsed.currentStep !== "number") return null;
    if (!Number.isFinite(parsed.currentStep)) return null;
    if (parsed.currentStep < 0) return null;
    if (typeof parsed.isOnbordaVisible !== "boolean") return null;
    if (typeof parsed.updatedAt !== "number") return null;

    return {
      version: 1,
      currentTour: parsed.currentTour ?? null,
      currentStep: parsed.currentStep,
      isOnbordaVisible: parsed.isOnbordaVisible,
      updatedAt: parsed.updatedAt,
    };
  } catch {
    return null;
  }
};

const readPersistedProgress = (
  storage: OnbordaProgressStorage | null,
  storageKey: string
) => {
  try {
    return parsePersistedProgress(storage?.getItem(storageKey) ?? null);
  } catch {
    return null;
  }
};

const writePersistedProgress = (
  storage: OnbordaProgressStorage,
  storageKey: string,
  progress: OnbordaPersistedProgress
) => {
  try {
    storage.setItem(storageKey, JSON.stringify(progress));
  } catch {
    // Storage can fail in private browsing or when quota is exceeded.
  }
};

const removePersistedProgress = (
  storage: OnbordaProgressStorage,
  storageKey: string
) => {
  try {
    storage.removeItem(storageKey);
  } catch {
    // Storage can fail in private browsing or when quota is exceeded.
  }
};

const OnbordaProvider: React.FC<OnbordaProviderProps> = ({
  children,
  initialTours = [],
  currentTour: controlledCurrentTour,
  currentStep: controlledCurrentStep,
  isOnbordaVisible: controlledIsOnbordaVisible,
  defaultCurrentTour = null,
  defaultCurrentStep = 0,
  defaultIsOnbordaVisible = false,
  progressPersistence = false,
  onCurrentTourChange,
  onCurrentStepChange,
  onOpenChange,
  onStateChange,
}) => {
  const [uncontrolledCurrentTour, setUncontrolledCurrentTour] =
    useState<string | null>(defaultCurrentTour);
  const [uncontrolledCurrentStep, setUncontrolledCurrentStep] =
    useState(defaultCurrentStep);
  const [uncontrolledIsOnbordaVisible, setUncontrolledIsOnbordaVisible] =
    useState(defaultIsOnbordaVisible);
  const [registeredTours, setRegisteredTours] = useState<Tour[]>(initialTours);
  const progressConfig = useMemo(
    () => getProgressPersistenceConfig(progressPersistence),
    [progressPersistence]
  );
  const [hasRestoredProgress, setHasRestoredProgress] = useState(
    !progressConfig.enabled || !progressConfig.restore
  );

  const currentTour =
    controlledCurrentTour !== undefined
      ? controlledCurrentTour
      : uncontrolledCurrentTour;
  const currentStep =
    controlledCurrentStep !== undefined
      ? controlledCurrentStep
      : uncontrolledCurrentStep;
  const isOnbordaVisible =
    controlledIsOnbordaVisible !== undefined
      ? controlledIsOnbordaVisible
      : uncontrolledIsOnbordaVisible;

  const delayTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stateRef = useRef<OnbordaState>({
    currentTour,
    currentStep,
    isOnbordaVisible,
  });
  const controlRef = useRef({
    currentTour: controlledCurrentTour !== undefined,
    currentStep: controlledCurrentStep !== undefined,
    isOnbordaVisible: controlledIsOnbordaVisible !== undefined,
  });
  const callbackRef = useRef({
    onCurrentTourChange,
    onCurrentStepChange,
    onOpenChange,
    onStateChange,
  });
  const progressConfigRef = useRef(progressConfig);

  stateRef.current = { currentTour, currentStep, isOnbordaVisible };
  progressConfigRef.current = progressConfig;
  controlRef.current = {
    currentTour: controlledCurrentTour !== undefined,
    currentStep: controlledCurrentStep !== undefined,
    isOnbordaVisible: controlledIsOnbordaVisible !== undefined,
  };
  callbackRef.current = {
    onCurrentTourChange,
    onCurrentStepChange,
    onOpenChange,
    onStateChange,
  };

  const updateState = useCallback((patch: Partial<OnbordaState>) => {
    const previousState = stateRef.current;
    const nextState = { ...previousState, ...patch };
    const controlled = controlRef.current;
    const callbacks = callbackRef.current;

    if (hasStateKey(patch, "currentTour") && !controlled.currentTour) {
      setUncontrolledCurrentTour(nextState.currentTour);
    }
    if (hasStateKey(patch, "currentStep") && !controlled.currentStep) {
      setUncontrolledCurrentStep(nextState.currentStep);
    }
    if (
      hasStateKey(patch, "isOnbordaVisible") &&
      !controlled.isOnbordaVisible
    ) {
      setUncontrolledIsOnbordaVisible(nextState.isOnbordaVisible);
    }

    if (
      hasStateKey(patch, "currentTour") &&
      previousState.currentTour !== nextState.currentTour
    ) {
      callbacks.onCurrentTourChange?.(nextState.currentTour);
    }
    if (
      hasStateKey(patch, "currentStep") &&
      previousState.currentStep !== nextState.currentStep
    ) {
      callbacks.onCurrentStepChange?.(nextState.currentStep);
    }
    if (
      hasStateKey(patch, "isOnbordaVisible") &&
      previousState.isOnbordaVisible !== nextState.isOnbordaVisible
    ) {
      callbacks.onOpenChange?.(nextState.isOnbordaVisible);
    }

    stateRef.current = nextState;
    callbacks.onStateChange?.(nextState);
  }, []);

  const clearDelayedStep = useCallback(() => {
    if (!delayTimeoutRef.current) return;

    clearTimeout(delayTimeoutRef.current);
    delayTimeoutRef.current = null;
  }, []);

  const clearPersistedProgress = useCallback(() => {
    const { enabled, storage, storageKey } = progressConfigRef.current;
    if (!enabled || !storage) return;

    removePersistedProgress(storage, storageKey);
  }, []);

  const unregisterTour = useCallback((tourName: string) => {
    setRegisteredTours((currentTours) =>
      currentTours.filter((tour) => tour.tour !== tourName)
    );
  }, []);

  const registerTours = useCallback((tours: Tour[]) => {
    setRegisteredTours((currentTours) => upsertTours(currentTours, tours));

    return () => {
      setRegisteredTours((currentTours) =>
        currentTours.filter(
          (tour) => !tours.some((registeredTour) => registeredTour.tour === tour.tour)
        )
      );
    };
  }, []);

  const registerTour = useCallback((tour: Tour) => {
    return registerTours([tour]);
  }, [registerTours]);

  const setCurrentStep = useCallback((step: number, delay?: number) => {
    clearDelayedStep();
    if (delay) {
      delayTimeoutRef.current = setTimeout(() => {
        delayTimeoutRef.current = null;
        updateState({ currentStep: step, isOnbordaVisible: true });
      }, delay);
      return;
    }

    updateState({ currentStep: step, isOnbordaVisible: true });
  }, [clearDelayedStep, updateState]);

  const closeOnborda = useCallback(() => {
    clearDelayedStep();
    updateState({ currentTour: null, isOnbordaVisible: false });
  }, [clearDelayedStep, updateState]);

  const startOnborda = useCallback((tourName: string) => {
    clearDelayedStep();
    updateState({
      currentTour: tourName,
      currentStep: 0,
      isOnbordaVisible: true,
    });
  }, [clearDelayedStep, updateState]);

  useEffect(() => clearDelayedStep, [clearDelayedStep]);

  useEffect(() => {
    if (!progressConfig.enabled || !progressConfig.restore) {
      setHasRestoredProgress(true);
      return;
    }

    const restoredProgress = readPersistedProgress(
      progressConfig.storage,
      progressConfig.storageKey
    );

    if (restoredProgress) {
      updateState({
        currentTour: restoredProgress.currentTour,
        currentStep: restoredProgress.currentStep,
        isOnbordaVisible: restoredProgress.isOnbordaVisible,
      });
    }

    setHasRestoredProgress(true);
  }, [
    progressConfig.enabled,
    progressConfig.restore,
    progressConfig.storage,
    progressConfig.storageKey,
    updateState,
  ]);

  useEffect(() => {
    if (!progressConfig.enabled || !progressConfig.storage || !hasRestoredProgress) {
      return;
    }

    const progress: OnbordaPersistedProgress = {
      version: 1,
      currentTour,
      currentStep,
      isOnbordaVisible,
      updatedAt: Date.now(),
    };

    writePersistedProgress(
      progressConfig.storage,
      progressConfig.storageKey,
      progress
    );
  }, [
    currentStep,
    currentTour,
    hasRestoredProgress,
    isOnbordaVisible,
    progressConfig.enabled,
    progressConfig.storage,
    progressConfig.storageKey,
  ]);

  const contextValue = useMemo(
    () => ({
      currentTour,
      currentStep,
      setCurrentStep,
      closeOnborda,
      startOnborda,
      clearPersistedProgress,
      registeredTours,
      registerTour,
      registerTours,
      unregisterTour,
      isOnbordaVisible,
    }),
    [
      clearPersistedProgress,
      closeOnborda,
      currentStep,
      currentTour,
      isOnbordaVisible,
      registeredTours,
      registerTour,
      registerTours,
      setCurrentStep,
      startOnborda,
      unregisterTour,
    ]
  );

  return (
    <OnbordaContext.Provider value={contextValue}>
      {children}
    </OnbordaContext.Provider>
  );
};

export { OnbordaProvider, useOnborda };
