"use client";
import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useState, useCallback, useMemo, useRef, useEffect, } from "react";
const OkidoContext = createContext(undefined);
const useOkido = () => {
    const context = useContext(OkidoContext);
    if (context === undefined) {
        throw new Error("useOkido must be used within an OkidoProvider");
    }
    return context;
};
const hasStateKey = (patch, key) => Object.prototype.hasOwnProperty.call(patch, key);
const upsertTours = (currentTours, nextTours) => {
    const tourMap = new Map(currentTours.map((tour) => [tour.tour, tour]));
    nextTours.forEach((tour) => {
        tourMap.set(tour.tour, tour);
    });
    return Array.from(tourMap.values());
};
const defaultProgressStorageKey = "okido:progress";
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
        if (typeof parsed.isOkidoVisible !== "boolean")
            return null;
        if (typeof parsed.updatedAt !== "number")
            return null;
        return {
            version: 1,
            currentTour: parsed.currentTour ?? null,
            currentStep: parsed.currentStep,
            isOkidoVisible: parsed.isOkidoVisible,
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
const OkidoProvider = ({ children, initialTours = [], currentTour: controlledCurrentTour, currentStep: controlledCurrentStep, isOkidoVisible: controlledIsOkidoVisible, defaultCurrentTour = null, defaultCurrentStep = 0, defaultIsOkidoVisible = false, progressPersistence = false, onCurrentTourChange, onCurrentStepChange, onOpenChange, onStateChange, }) => {
    const [uncontrolledCurrentTour, setUncontrolledCurrentTour] = useState(defaultCurrentTour);
    const [uncontrolledCurrentStep, setUncontrolledCurrentStep] = useState(defaultCurrentStep);
    const [uncontrolledIsOkidoVisible, setUncontrolledIsOkidoVisible] = useState(defaultIsOkidoVisible);
    const [registeredTours, setRegisteredTours] = useState(initialTours);
    const progressConfig = useMemo(() => getProgressPersistenceConfig(progressPersistence), [progressPersistence]);
    const [hasRestoredProgress, setHasRestoredProgress] = useState(!progressConfig.enabled || !progressConfig.restore);
    const currentTour = controlledCurrentTour !== undefined
        ? controlledCurrentTour
        : uncontrolledCurrentTour;
    const currentStep = controlledCurrentStep !== undefined
        ? controlledCurrentStep
        : uncontrolledCurrentStep;
    const isOkidoVisible = controlledIsOkidoVisible !== undefined
        ? controlledIsOkidoVisible
        : uncontrolledIsOkidoVisible;
    const delayTimeoutRef = useRef(null);
    const stateRef = useRef({
        currentTour,
        currentStep,
        isOkidoVisible,
    });
    const controlRef = useRef({
        currentTour: controlledCurrentTour !== undefined,
        currentStep: controlledCurrentStep !== undefined,
        isOkidoVisible: controlledIsOkidoVisible !== undefined,
    });
    const callbackRef = useRef({
        onCurrentTourChange,
        onCurrentStepChange,
        onOpenChange,
        onStateChange,
    });
    const progressConfigRef = useRef(progressConfig);
    stateRef.current = { currentTour, currentStep, isOkidoVisible };
    progressConfigRef.current = progressConfig;
    controlRef.current = {
        currentTour: controlledCurrentTour !== undefined,
        currentStep: controlledCurrentStep !== undefined,
        isOkidoVisible: controlledIsOkidoVisible !== undefined,
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
        if (hasStateKey(patch, "isOkidoVisible") &&
            !controlled.isOkidoVisible) {
            setUncontrolledIsOkidoVisible(nextState.isOkidoVisible);
        }
        if (hasStateKey(patch, "currentTour") &&
            previousState.currentTour !== nextState.currentTour) {
            callbacks.onCurrentTourChange?.(nextState.currentTour);
        }
        if (hasStateKey(patch, "currentStep") &&
            previousState.currentStep !== nextState.currentStep) {
            callbacks.onCurrentStepChange?.(nextState.currentStep);
        }
        if (hasStateKey(patch, "isOkidoVisible") &&
            previousState.isOkidoVisible !== nextState.isOkidoVisible) {
            callbacks.onOpenChange?.(nextState.isOkidoVisible);
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
    const unregisterTour = useCallback((tourName) => {
        setRegisteredTours((currentTours) => currentTours.filter((tour) => tour.tour !== tourName));
    }, []);
    const registerTours = useCallback((tours) => {
        setRegisteredTours((currentTours) => upsertTours(currentTours, tours));
        return () => {
            setRegisteredTours((currentTours) => currentTours.filter((tour) => !tours.some((registeredTour) => registeredTour.tour === tour.tour)));
        };
    }, []);
    const registerTour = useCallback((tour) => {
        return registerTours([tour]);
    }, [registerTours]);
    const setCurrentStep = useCallback((step, delay) => {
        clearDelayedStep();
        if (delay) {
            delayTimeoutRef.current = setTimeout(() => {
                delayTimeoutRef.current = null;
                updateState({ currentStep: step, isOkidoVisible: true });
            }, delay);
            return;
        }
        updateState({ currentStep: step, isOkidoVisible: true });
    }, [clearDelayedStep, updateState]);
    const closeOkido = useCallback(() => {
        clearDelayedStep();
        updateState({ currentTour: null, isOkidoVisible: false });
    }, [clearDelayedStep, updateState]);
    const startOkido = useCallback((tourName) => {
        clearDelayedStep();
        updateState({
            currentTour: tourName,
            currentStep: 0,
            isOkidoVisible: true,
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
                isOkidoVisible: restoredProgress.isOkidoVisible,
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
            isOkidoVisible,
            updatedAt: Date.now(),
        };
        writePersistedProgress(progressConfig.storage, progressConfig.storageKey, progress);
    }, [
        currentStep,
        currentTour,
        hasRestoredProgress,
        isOkidoVisible,
        progressConfig.enabled,
        progressConfig.storage,
        progressConfig.storageKey,
    ]);
    const contextValue = useMemo(() => ({
        currentTour,
        currentStep,
        setCurrentStep,
        closeOkido,
        startOkido,
        clearPersistedProgress,
        registeredTours,
        registerTour,
        registerTours,
        unregisterTour,
        isOkidoVisible,
    }), [
        clearPersistedProgress,
        closeOkido,
        currentStep,
        currentTour,
        isOkidoVisible,
        registeredTours,
        registerTour,
        registerTours,
        setCurrentStep,
        startOkido,
        unregisterTour,
    ]);
    return (_jsx(OkidoContext.Provider, { value: contextValue, children: children }));
};
export { OkidoProvider, useOkido };
