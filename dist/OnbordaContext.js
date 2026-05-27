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
const OnbordaProvider = ({ children, currentTour: controlledCurrentTour, currentStep: controlledCurrentStep, isOnbordaVisible: controlledIsOnbordaVisible, defaultCurrentTour = null, defaultCurrentStep = 0, defaultIsOnbordaVisible = false, onCurrentTourChange, onCurrentStepChange, onOpenChange, onStateChange, }) => {
    const [uncontrolledCurrentTour, setUncontrolledCurrentTour] = useState(defaultCurrentTour);
    const [uncontrolledCurrentStep, setUncontrolledCurrentStep] = useState(defaultCurrentStep);
    const [uncontrolledIsOnbordaVisible, setUncontrolledIsOnbordaVisible] = useState(defaultIsOnbordaVisible);
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
    stateRef.current = { currentTour, currentStep, isOnbordaVisible };
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
    const contextValue = useMemo(() => ({
        currentTour,
        currentStep,
        setCurrentStep,
        closeOnborda,
        startOnborda,
        isOnbordaVisible,
    }), [
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
