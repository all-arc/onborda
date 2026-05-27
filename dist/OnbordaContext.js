"use client";
import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useState, useCallback, useMemo, useRef, useEffect, } from "react";
const OnbordaContext = createContext(undefined);
const useOnborda = () => {
    const context = useContext(OnbordaContext);
    if (context === undefined) {
        throw new Error("useOnborda must be used within an OnbordaProvider");
    }
    return context;
};
const hasStateKey = (patch, key) => Object.prototype.hasOwnProperty.call(patch, key);
const defaultProgressStorageKey = "onborda:progress";
const getBrowserStorage = () => {
    if (typeof window === "undefined" || !window.localStorage)
        return null;
    return window.localStorage;
};
const getProgressPersistenceConfig = (progressPersistence) => {
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
const parsePersistedProgress = (value) => {
    if (!value)
        return null;
    try {
        const parsed = JSON.parse(value);
        if (parsed.version !== 1)
            return null;
        if (parsed.currentTour !== null &&
            typeof parsed.currentTour !== "string") {
            return null;
        }
        if (typeof parsed.currentStep !== "number")
            return null;
        if (!Number.isFinite(parsed.currentStep))
            return null;
        if (parsed.currentStep < 0)
            return null;
        if (typeof parsed.isOnbordaVisible !== "boolean")
            return null;
        if (typeof parsed.updatedAt !== "number")
            return null;
        return {
            version: 1,
            currentTour: parsed.currentTour ?? null,
            currentStep: parsed.currentStep,
            isOnbordaVisible: parsed.isOnbordaVisible,
            updatedAt: parsed.updatedAt,
        };
    }
    catch {
        return null;
    }
};
const readPersistedProgress = (storage, storageKey) => {
    try {
        return parsePersistedProgress(storage?.getItem(storageKey) ?? null);
    }
    catch {
        return null;
    }
};
const writePersistedProgress = (storage, storageKey, progress) => {
    try {
        storage.setItem(storageKey, JSON.stringify(progress));
    }
    catch {
        // Storage can fail in private browsing or when quota is exceeded.
    }
};
const removePersistedProgress = (storage, storageKey) => {
    try {
        storage.removeItem(storageKey);
    }
    catch {
        // Storage can fail in private browsing or when quota is exceeded.
    }
};
const OnbordaProvider = ({ children, currentTour: controlledCurrentTour, currentStep: controlledCurrentStep, isOnbordaVisible: controlledIsOnbordaVisible, defaultCurrentTour = null, defaultCurrentStep = 0, defaultIsOnbordaVisible = false, progressPersistence = false, onCurrentTourChange, onCurrentStepChange, onOpenChange, onStateChange, }) => {
    const [uncontrolledCurrentTour, setUncontrolledCurrentTour] = useState(defaultCurrentTour);
    const [uncontrolledCurrentStep, setUncontrolledCurrentStep] = useState(defaultCurrentStep);
    const [uncontrolledIsOnbordaVisible, setUncontrolledIsOnbordaVisible] = useState(defaultIsOnbordaVisible);
    const progressConfig = useMemo(() => getProgressPersistenceConfig(progressPersistence), [progressPersistence]);
    const [hasRestoredProgress, setHasRestoredProgress] = useState(!progressConfig.enabled || !progressConfig.restore);
    const currentTour = controlledCurrentTour !== undefined
        ? controlledCurrentTour
        : uncontrolledCurrentTour;
    const currentStep = controlledCurrentStep !== undefined
        ? controlledCurrentStep
        : uncontrolledCurrentStep;
    const isOnbordaVisible = controlledIsOnbordaVisible !== undefined
        ? controlledIsOnbordaVisible
        : uncontrolledIsOnbordaVisible;
    const delayTimeoutRef = useRef(null);
    const stateRef = useRef({
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
    const updateState = useCallback((patch) => {
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
        if (hasStateKey(patch, "isOnbordaVisible") &&
            !controlled.isOnbordaVisible) {
            setUncontrolledIsOnbordaVisible(nextState.isOnbordaVisible);
        }
        if (hasStateKey(patch, "currentTour") &&
            previousState.currentTour !== nextState.currentTour) {
            callbacks.onCurrentTourChange?.(nextState.currentTour);
        }
        if (hasStateKey(patch, "currentStep") &&
            previousState.currentStep !== nextState.currentStep) {
            callbacks.onCurrentStepChange?.(nextState.currentStep);
        }
        if (hasStateKey(patch, "isOnbordaVisible") &&
            previousState.isOnbordaVisible !== nextState.isOnbordaVisible) {
            callbacks.onOpenChange?.(nextState.isOnbordaVisible);
        }
        stateRef.current = nextState;
        callbacks.onStateChange?.(nextState);
    }, []);
    const clearDelayedStep = useCallback(() => {
        if (!delayTimeoutRef.current)
            return;
        clearTimeout(delayTimeoutRef.current);
        delayTimeoutRef.current = null;
    }, []);
    const clearPersistedProgress = useCallback(() => {
        const { enabled, storage, storageKey } = progressConfigRef.current;
        if (!enabled || !storage)
            return;
        removePersistedProgress(storage, storageKey);
    }, []);
    const setCurrentStep = useCallback((step, delay) => {
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
    const startOnborda = useCallback((tourName) => {
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
        const restoredProgress = readPersistedProgress(progressConfig.storage, progressConfig.storageKey);
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
        const progress = {
            version: 1,
            currentTour,
            currentStep,
            isOnbordaVisible,
            updatedAt: Date.now(),
        };
        writePersistedProgress(progressConfig.storage, progressConfig.storageKey, progress);
    }, [
        currentStep,
        currentTour,
        hasRestoredProgress,
        isOnbordaVisible,
        progressConfig.enabled,
        progressConfig.storage,
        progressConfig.storageKey,
    ]);
    const contextValue = useMemo(() => ({
        currentTour,
        currentStep,
        setCurrentStep,
        closeOnborda,
        startOnborda,
        clearPersistedProgress,
        isOnbordaVisible,
    }), [
        clearPersistedProgress,
        closeOnborda,
        currentStep,
        currentTour,
        isOnbordaVisible,
        setCurrentStep,
        startOnborda,
    ]);
    return (_jsx(OnbordaContext.Provider, { value: contextValue, children: children }));
};
export { OnbordaProvider, useOnborda };
