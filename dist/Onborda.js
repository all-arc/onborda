"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useEffect, useId, useMemo, useRef, useState, } from "react";
import { useOnborda } from "./OnbordaContext.js";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Portal } from "@radix-ui/react-portal";
import { FloatingFocusManager, useFloating, offset as floatingOffset, flip, shift, arrow, autoUpdate, } from "@floating-ui/react";
const offset = 20;
const placementMap = {
    "top": "top",
    "bottom": "bottom",
    "left": "left",
    "right": "right",
    "top-left": "top-start",
    "top-right": "top-end",
    "bottom-left": "bottom-start",
    "bottom-right": "bottom-end",
    "right-top": "right-start",
    "right-bottom": "right-end",
    "left-top": "left-start",
    "left-bottom": "left-end",
};
const isEditableElement = (target) => {
    if (!(target instanceof HTMLElement))
        return false;
    const tagName = target.tagName.toLowerCase();
    return (tagName === "input" ||
        tagName === "textarea" ||
        tagName === "select" ||
        target.isContentEditable);
};
const getElementRect = (element) => {
    const { top, left, width, height } = element.getBoundingClientRect();
    return {
        x: left,
        y: top,
        width,
        height,
    };
};
const resolveA11yText = (value, context) => {
    if (typeof value === "function")
        return value(context);
    return value;
};
const mergeTours = (tourGroups) => {
    const tourMap = new Map();
    tourGroups.flat().forEach((tour) => {
        tourMap.set(tour.tour, tour);
    });
    return Array.from(tourMap.values());
};
const shouldIncludeStep = (tourName, step, stepIndex) => {
    if (step.when === undefined)
        return true;
    if (typeof step.when === "boolean")
        return step.when;
    return step.when({ tour: tourName, step, stepIndex });
};
const filterConditionalSteps = (tours) => tours.map((tour) => ({
    ...tour,
    steps: tour.steps.filter((step, stepIndex) => shouldIncludeStep(tour.tour, step, stepIndex)),
}));
const getNow = () => Date.now();
const getNodeEnv = () => globalThis.process?.env
    ?.NODE_ENV;
const callButtonAction = (event, props, action) => {
    props?.onClick?.(event);
    if (!event.defaultPrevented) {
        action();
    }
};
const createHeadlessButtonProps = (props, action, defaults) => ({
    ...props,
    type: props?.type ?? defaults.type ?? "button",
    disabled: props?.disabled ?? defaults.disabled,
    "aria-label": props?.["aria-label"] ?? defaults["aria-label"],
    onClick: (event) => {
        callButtonAction(event, props, action);
    },
});
const Onborda = ({ children, interact = false, steps, shadowRgb = "0, 0, 0", shadowOpacity = "0.2", cardTransition = { ease: "anticipate", duration: 0.6 }, cardComponent: CardComponent, targetMissingPolicy = "fallback", accessibility, devWarnings, debug, onTourStart, onStepChange, onTargetMissing, onRouteTransitionStart, onRouteTransitionComplete, onRouteTransitionTimeout, onRouteTransitionError, onStepsLoadStart, onStepsLoadSuccess, onStepsLoadError, onAnalyticsEvent, onTourComplete, onTourSkip, }) => {
    const { currentTour, currentStep, setCurrentStep, isOnbordaVisible, closeOnborda, registeredTours, } = useOnborda();
    const [asyncTours, setAsyncTours] = useState([]);
    const propTours = Array.isArray(steps) ? steps : asyncTours;
    const availableTours = useMemo(() => filterConditionalSteps(mergeTours([registeredTours, propTours])), [propTours, registeredTours]);
    const currentTourSteps = useMemo(() => availableTours.find((tour) => tour.tour === currentTour)?.steps, [availableTours, currentTour]);
    const activeStep = currentTourSteps?.[currentStep];
    const [pointerPosition, setPointerPosition] = useState(null);
    const [targetStatus, setTargetStatus] = useState("unknown");
    const currentElementRef = useRef(null);
    const savedElementStyleRef = useRef(null);
    const mutationObserverRef = useRef(null);
    const mutationTimeoutRef = useRef(null);
    const cardRef = useRef(null);
    const arrowRef = useRef(null);
    const returnFocusRef = useRef(null);
    const wasVisibleRef = useRef(false);
    const navigationDirectionRef = useRef("forward");
    const lastMissingTargetRef = useRef(null);
    const devWarningKeysRef = useRef(new Set());
    const maskId = useId();
    const dialogId = useId();
    const titleId = useId();
    const descriptionId = useId();
    // Route Changes
    const router = useRouter();
    const debugOptions = typeof debug === "object" ? debug : undefined;
    const debugEnabled = typeof debug === "boolean"
        ? debug
        : debugOptions?.enabled ?? !!debugOptions;
    const debugShouldLog = debugOptions?.log ?? debugEnabled;
    const shouldShowDevWarnings = devWarnings ?? (debugEnabled || getNodeEnv() === "development");
    const emitDebug = useCallback((event) => {
        if (!debugEnabled)
            return;
        const debugEvent = {
            ...event,
            timestamp: getNow(),
        };
        debugOptions?.onEvent?.(debugEvent);
        if (debugShouldLog) {
            console.debug(`[Onborda] ${event.message}`, event.data ?? "");
        }
    }, [debugEnabled, debugOptions, debugShouldLog]);
    const warnDev = useCallback((key, message, data) => {
        if (!shouldShowDevWarnings || devWarningKeysRef.current.has(key))
            return;
        devWarningKeysRef.current.add(key);
        console.warn(`Onborda: ${message}`, data ?? "");
        emitDebug({
            type: "dev_warning",
            message,
            data,
        });
    }, [emitDebug, shouldShowDevWarnings]);
    const querySelector = useCallback((selector, context) => {
        try {
            return document.querySelector(selector);
        }
        catch (error) {
            warnDev(`invalid-selector:${selector}:${context}`, `Invalid selector "${selector}" in ${context}.`, { selector, context, error });
            return null;
        }
    }, [warnDev]);
    const emitAnalytics = useCallback((event) => {
        const analyticsEvent = {
            ...event,
            timestamp: getNow(),
        };
        onAnalyticsEvent?.(analyticsEvent);
        emitDebug({
            type: "analytics",
            message: `Analytics event: ${event.type}`,
            data: analyticsEvent,
        });
    }, [emitDebug, onAnalyticsEvent]);
    useEffect(() => {
        if (typeof steps !== "function") {
            return;
        }
        let isActive = true;
        onStepsLoadStart?.();
        emitAnalytics({ type: "steps_load_start" });
        Promise.resolve()
            .then(() => steps())
            .then((loadedTours) => {
            if (!isActive)
                return;
            if (!Array.isArray(loadedTours)) {
                throw new Error("Onborda steps loader must resolve to an array of tours.");
            }
            setAsyncTours(loadedTours);
            onStepsLoadSuccess?.(loadedTours);
            emitAnalytics({ type: "steps_load_success" });
            emitDebug({
                type: "steps",
                message: "Async steps loaded.",
                data: loadedTours,
            });
        })
            .catch((error) => {
            if (!isActive)
                return;
            warnDev("steps-loader-error", "Async steps loader failed.", error);
            onStepsLoadError?.(error);
            emitAnalytics({ type: "steps_load_error", error });
        });
        return () => {
            isActive = false;
        };
    }, [
        emitAnalytics,
        emitDebug,
        onStepsLoadError,
        onStepsLoadStart,
        onStepsLoadSuccess,
        steps,
        warnDev,
    ]);
    const updatePointerPosition = useCallback((element = currentElementRef.current) => {
        if (!element) {
            setPointerPosition(null);
            return;
        }
        setPointerPosition(getElementRect(element));
    }, []);
    // Floating UI Setup
    const placement = activeStep?.side ? placementMap[activeStep.side] : "bottom";
    const floatingMiddleware = useMemo(() => [
        floatingOffset(25),
        flip({
            fallbackPlacements: ["bottom", "top", "right", "left"],
        }),
        shift({ padding: 10 }),
        arrow({ element: arrowRef }),
    ], []);
    const { refs, floatingStyles, middlewareData, placement: finalPlacement, context } = useFloating({
        placement,
        whileElementsMounted: (reference, floating, update) => autoUpdate(reference, floating, () => {
            update();
            if (reference instanceof Element) {
                updatePointerPosition(reference);
            }
        }),
        open: isOnbordaVisible && !!activeStep,
        middleware: floatingMiddleware,
    });
    const cleanupMutationObserver = useCallback(() => {
        if (mutationObserverRef.current) {
            mutationObserverRef.current.disconnect();
            mutationObserverRef.current = null;
        }
        if (mutationTimeoutRef.current) {
            clearTimeout(mutationTimeoutRef.current);
            mutationTimeoutRef.current = null;
        }
    }, []);
    const restoreActiveElementStyle = useCallback(() => {
        const savedStyle = savedElementStyleRef.current;
        if (!savedStyle)
            return;
        savedStyle.element.style.position = savedStyle.position;
        savedStyle.element.style.zIndex = savedStyle.zIndex;
        savedElementStyleRef.current = null;
    }, []);
    const applyActiveElementStyle = useCallback((element) => {
        if (!interact)
            return;
        const savedStyle = savedElementStyleRef.current;
        if (savedStyle?.element !== element) {
            restoreActiveElementStyle();
            savedElementStyleRef.current = {
                element,
                position: element.style.position,
                zIndex: element.style.zIndex,
            };
        }
        const computedPosition = window.getComputedStyle(element).position;
        if (computedPosition === "static") {
            element.style.position = "relative";
        }
        element.style.zIndex = "990";
    }, [interact, restoreActiveElementStyle]);
    const clearActiveElement = useCallback(() => {
        restoreActiveElementStyle();
        currentElementRef.current = null;
        setPointerPosition(null);
        refs.setReference(null);
    }, [refs, restoreActiveElementStyle]);
    const scrollElementIntoView = useCallback((element) => {
        const rect = element.getBoundingClientRect();
        const isInViewport = rect.top >= -offset &&
            rect.left >= -offset &&
            rect.bottom <= window.innerHeight + offset &&
            rect.right <= window.innerWidth + offset;
        if (!isInViewport) {
            element.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
        }
    }, []);
    const syncActiveElement = useCallback(() => {
        if (!isOnbordaVisible || !activeStep) {
            clearActiveElement();
            setTargetStatus("unknown");
            return;
        }
        const element = querySelector(activeStep.selector, "active step");
        if (!element) {
            clearActiveElement();
            setTargetStatus("missing");
            return;
        }
        if (currentElementRef.current !== element) {
            restoreActiveElementStyle();
        }
        currentElementRef.current = element;
        applyActiveElementStyle(element);
        refs.setReference(element);
        setTargetStatus("found");
        updatePointerPosition(element);
        scrollElementIntoView(element);
    }, [
        activeStep,
        applyActiveElementStyle,
        clearActiveElement,
        isOnbordaVisible,
        querySelector,
        refs,
        restoreActiveElementStyle,
        scrollElementIntoView,
        updatePointerPosition,
    ]);
    const scrollToElement = useCallback((stepIndex) => {
        if (!currentTourSteps)
            return;
        const element = querySelector(currentTourSteps[stepIndex].selector, "step navigation");
        if (!element) {
            setPointerPosition(null);
            return;
        }
        scrollElementIntoView(element);
        updatePointerPosition(element);
    }, [currentTourSteps, querySelector, scrollElementIntoView, updatePointerPosition]);
    const getRouteTransition = useCallback((toStepIndex, route, direction) => {
        if (!currentTour || !currentTourSteps)
            return null;
        const fromStep = currentTourSteps[currentStep];
        const toStep = currentTourSteps[toStepIndex];
        if (!fromStep || !toStep)
            return null;
        return {
            tour: currentTour,
            fromStepIndex: currentStep,
            toStepIndex,
            fromStep,
            toStep,
            route,
            direction,
        };
    }, [currentStep, currentTour, currentTourSteps]);
    // Lifecycle wrappers
    const handleComplete = useCallback(() => {
        if (currentTour) {
            if (onTourComplete)
                onTourComplete(currentTour);
            emitAnalytics({ type: "tour_complete", tour: currentTour });
        }
        cleanupMutationObserver();
        closeOnborda();
    }, [cleanupMutationObserver, closeOnborda, currentTour, emitAnalytics, onTourComplete]);
    const handleSkip = useCallback(() => {
        if (currentTour) {
            if (onTourSkip)
                onTourSkip(currentTour, currentStep);
            emitAnalytics({
                type: "tour_skip",
                tour: currentTour,
                stepIndex: currentStep,
                step: activeStep,
                totalSteps: currentTourSteps?.length,
            });
        }
        cleanupMutationObserver();
        closeOnborda();
    }, [
        activeStep,
        cleanupMutationObserver,
        closeOnborda,
        currentStep,
        currentTour,
        currentTourSteps,
        emitAnalytics,
        onTourSkip,
    ]);
    const handleClose = useCallback(() => {
        cleanupMutationObserver();
        closeOnborda();
    }, [cleanupMutationObserver, closeOnborda]);
    // 1. Lifecycle Hook: onTourStart
    const tourStartedRef = useRef(null);
    useEffect(() => {
        if (isOnbordaVisible && currentTour) {
            if (tourStartedRef.current !== currentTour) {
                tourStartedRef.current = currentTour;
                if (onTourStart)
                    onTourStart(currentTour);
                emitAnalytics({ type: "tour_start", tour: currentTour });
            }
        }
        else {
            tourStartedRef.current = null;
        }
    }, [currentTour, emitAnalytics, isOnbordaVisible, onTourStart]);
    useEffect(() => {
        if (!isOnbordaVisible || !currentTour)
            return;
        if (!currentTourSteps) {
            warnDev(`missing-tour:${currentTour}`, `Tour "${currentTour}" is active but no matching tour is registered.`, { currentTour, availableTours });
            return;
        }
        if (currentTourSteps.length === 0) {
            warnDev(`empty-tour:${currentTour}`, `Tour "${currentTour}" has no renderable steps.`, { currentTour });
        }
    }, [availableTours, currentTour, currentTourSteps, isOnbordaVisible, warnDev]);
    // 2. Lifecycle Hook: onStepChange
    const lastFiredStepRef = useRef(null);
    useEffect(() => {
        if (isOnbordaVisible && currentTour && currentTourSteps) {
            const step = currentTourSteps[currentStep];
            if (step && lastFiredStepRef.current !== currentStep) {
                lastFiredStepRef.current = currentStep;
                if (onStepChange)
                    onStepChange(currentTour, currentStep, step);
                emitAnalytics({
                    type: "step_change",
                    tour: currentTour,
                    stepIndex: currentStep,
                    step,
                    totalSteps: currentTourSteps.length,
                });
            }
        }
        else {
            lastFiredStepRef.current = null;
        }
    }, [
        currentStep,
        currentTour,
        currentTourSteps,
        emitAnalytics,
        isOnbordaVisible,
        onStepChange,
    ]);
    // Target element tracking and initial scroll
    useEffect(() => {
        syncActiveElement();
        return () => {
            restoreActiveElementStyle();
        };
    }, [syncActiveElement, restoreActiveElementStyle]);
    // keydown navigation hook
    useEffect(() => {
        if (!isOnbordaVisible)
            return;
        const handleKeyDown = (e) => {
            switch (e.key) {
                case "Escape":
                    e.preventDefault();
                    handleSkip();
                    break;
                case "ArrowRight":
                    if (isEditableElement(e.target))
                        return;
                    e.preventDefault();
                    nextStep();
                    break;
                case "ArrowLeft":
                    if (isEditableElement(e.target))
                        return;
                    e.preventDefault();
                    prevStep();
                    break;
                default:
                    break;
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    });
    // Track the element that had focus before the tour opened and restore it on close.
    useEffect(() => {
        if (!isOnbordaVisible) {
            const handleFocusIn = (event) => {
                if (event.target instanceof HTMLElement) {
                    returnFocusRef.current = event.target;
                }
            };
            document.addEventListener("focusin", handleFocusIn);
            return () => document.removeEventListener("focusin", handleFocusIn);
        }
    }, [isOnbordaVisible]);
    useEffect(() => {
        if (wasVisibleRef.current && !isOnbordaVisible) {
            returnFocusRef.current?.focus();
        }
        wasVisibleRef.current = isOnbordaVisible;
    }, [isOnbordaVisible]);
    // Clean up mutation observers, timers, and target styles on unmount
    useEffect(() => {
        return () => {
            cleanupMutationObserver();
            restoreActiveElementStyle();
        };
    }, [cleanupMutationObserver, restoreActiveElementStyle]);
    const waitForRouteTarget = useCallback((stepIndex, routeTransition) => {
        if (!currentTourSteps)
            return;
        const targetSelector = currentTourSteps[stepIndex].selector;
        const showStep = (targetFound) => {
            setCurrentStep(stepIndex);
            scrollToElement(stepIndex);
            onRouteTransitionComplete?.({
                ...routeTransition,
                targetFound,
            });
            emitAnalytics({
                type: "route_transition_complete",
                tour: routeTransition.tour,
                stepIndex: routeTransition.toStepIndex,
                step: routeTransition.toStep,
                routeTransition: {
                    ...routeTransition,
                    targetFound,
                },
            });
        };
        if (querySelector(targetSelector, "route transition")) {
            showStep(true);
            return;
        }
        const observer = new MutationObserver((_, obs) => {
            if (!querySelector(targetSelector, "route transition observer"))
                return;
            if (mutationTimeoutRef.current) {
                clearTimeout(mutationTimeoutRef.current);
                mutationTimeoutRef.current = null;
            }
            showStep(true);
            obs.disconnect();
            mutationObserverRef.current = null;
        });
        cleanupMutationObserver();
        mutationObserverRef.current = observer;
        observer.observe(document.body, {
            childList: true,
            subtree: true,
        });
        // 5-second safeguard timeout
        mutationTimeoutRef.current = setTimeout(() => {
            console.warn(`Onborda: Element with selector "${targetSelector}" was not found within 5 seconds.`);
            observer.disconnect();
            mutationObserverRef.current = null;
            mutationTimeoutRef.current = null;
            onRouteTransitionTimeout?.(routeTransition);
            emitAnalytics({
                type: "route_transition_timeout",
                tour: routeTransition.tour,
                stepIndex: routeTransition.toStepIndex,
                step: routeTransition.toStep,
                routeTransition,
            });
            setCurrentStep(stepIndex);
            onRouteTransitionComplete?.({
                ...routeTransition,
                targetFound: false,
            });
            emitAnalytics({
                type: "route_transition_complete",
                tour: routeTransition.tour,
                stepIndex: routeTransition.toStepIndex,
                step: routeTransition.toStep,
                routeTransition: {
                    ...routeTransition,
                    targetFound: false,
                },
            });
        }, 5000);
    }, [
        cleanupMutationObserver,
        currentTourSteps,
        emitAnalytics,
        onRouteTransitionComplete,
        onRouteTransitionTimeout,
        querySelector,
        scrollToElement,
        setCurrentStep,
    ]);
    // Step Controls
    const nextStep = useCallback(async () => {
        if (!currentTourSteps)
            return;
        if (currentStep < currentTourSteps.length - 1) {
            let routeTransition = null;
            try {
                const nextStepIndex = currentStep + 1;
                const route = currentTourSteps[currentStep].nextRoute;
                navigationDirectionRef.current = "forward";
                cleanupMutationObserver();
                emitAnalytics({
                    type: "step_next",
                    tour: currentTour,
                    stepIndex: currentStep,
                    step: currentTourSteps[currentStep],
                    totalSteps: currentTourSteps.length,
                });
                if (route) {
                    routeTransition = getRouteTransition(nextStepIndex, route, "next");
                    if (!routeTransition)
                        return;
                    onRouteTransitionStart?.(routeTransition);
                    emitAnalytics({
                        type: "route_transition_start",
                        tour: routeTransition.tour,
                        stepIndex: routeTransition.fromStepIndex,
                        step: routeTransition.fromStep,
                        routeTransition,
                    });
                    await router.push(route);
                    waitForRouteTarget(nextStepIndex, routeTransition);
                }
                else {
                    setCurrentStep(nextStepIndex);
                    scrollToElement(nextStepIndex);
                }
            }
            catch (error) {
                if (routeTransition) {
                    onRouteTransitionError?.(routeTransition, error);
                    emitAnalytics({
                        type: "route_transition_error",
                        tour: routeTransition.tour,
                        stepIndex: routeTransition.fromStepIndex,
                        step: routeTransition.fromStep,
                        routeTransition,
                        error,
                    });
                }
                console.error("Error navigating to next route", error);
            }
        }
        else {
            handleComplete();
        }
    }, [
        cleanupMutationObserver,
        currentStep,
        currentTour,
        currentTourSteps,
        emitAnalytics,
        getRouteTransition,
        handleComplete,
        onRouteTransitionError,
        onRouteTransitionStart,
        router,
        scrollToElement,
        setCurrentStep,
        waitForRouteTarget,
    ]);
    const prevStep = useCallback(async () => {
        if (!currentTourSteps || currentStep <= 0)
            return;
        let routeTransition = null;
        try {
            const prevStepIndex = currentStep - 1;
            const route = currentTourSteps[currentStep].prevRoute;
            navigationDirectionRef.current = "backward";
            cleanupMutationObserver();
            emitAnalytics({
                type: "step_prev",
                tour: currentTour,
                stepIndex: currentStep,
                step: currentTourSteps[currentStep],
                totalSteps: currentTourSteps.length,
            });
            if (route) {
                routeTransition = getRouteTransition(prevStepIndex, route, "prev");
                if (!routeTransition)
                    return;
                onRouteTransitionStart?.(routeTransition);
                emitAnalytics({
                    type: "route_transition_start",
                    tour: routeTransition.tour,
                    stepIndex: routeTransition.fromStepIndex,
                    step: routeTransition.fromStep,
                    routeTransition,
                });
                await router.push(route);
                waitForRouteTarget(prevStepIndex, routeTransition);
            }
            else {
                setCurrentStep(prevStepIndex);
                scrollToElement(prevStepIndex);
            }
        }
        catch (error) {
            if (routeTransition) {
                onRouteTransitionError?.(routeTransition, error);
                emitAnalytics({
                    type: "route_transition_error",
                    tour: routeTransition.tour,
                    stepIndex: routeTransition.fromStepIndex,
                    step: routeTransition.fromStep,
                    routeTransition,
                    error,
                });
            }
            console.error("Error navigating to previous route", error);
        }
    }, [
        cleanupMutationObserver,
        currentStep,
        currentTour,
        currentTourSteps,
        emitAnalytics,
        getRouteTransition,
        onRouteTransitionError,
        onRouteTransitionStart,
        router,
        scrollToElement,
        setCurrentStep,
        waitForRouteTarget,
    ]);
    const skipMissingStep = useCallback(() => {
        if (!currentTourSteps)
            return;
        const stepOffset = navigationDirectionRef.current === "backward" ? -1 : 1;
        const nextStepIndex = currentStep + stepOffset;
        if (nextStepIndex >= 0 && nextStepIndex < currentTourSteps.length) {
            setTargetStatus("unknown");
            setCurrentStep(nextStepIndex);
            scrollToElement(nextStepIndex);
            return;
        }
        if (navigationDirectionRef.current === "forward") {
            handleComplete();
            return;
        }
        handleSkip();
    }, [
        currentStep,
        currentTourSteps,
        handleComplete,
        handleSkip,
        scrollToElement,
        setCurrentStep,
    ]);
    useEffect(() => {
        if (!isOnbordaVisible || !currentTour || !activeStep) {
            lastMissingTargetRef.current = null;
            return;
        }
        if (targetStatus !== "missing") {
            if (targetStatus === "found") {
                lastMissingTargetRef.current = null;
            }
            return;
        }
        const missingTargetKey = `${currentTour}:${currentStep}:${activeStep.selector}`;
        if (lastMissingTargetRef.current === missingTargetKey)
            return;
        lastMissingTargetRef.current = missingTargetKey;
        warnDev(`target-missing:${missingTargetKey}`, `Target selector "${activeStep.selector}" was not found for tour "${currentTour}".`, { tour: currentTour, stepIndex: currentStep, step: activeStep });
        onTargetMissing?.(currentTour, currentStep, activeStep);
        emitAnalytics({
            type: "target_missing",
            tour: currentTour,
            stepIndex: currentStep,
            step: activeStep,
            totalSteps: currentTourSteps?.length,
        });
        if (targetMissingPolicy === "skip-step") {
            skipMissingStep();
            return;
        }
        if (targetMissingPolicy === "skip-tour") {
            handleSkip();
        }
    }, [
        activeStep,
        currentStep,
        currentTour,
        currentTourSteps,
        emitAnalytics,
        handleSkip,
        isOnbordaVisible,
        onTargetMissing,
        skipMissingStep,
        targetMissingPolicy,
        targetStatus,
        warnDev,
    ]);
    // Dynamic SVG arrow position based on final floating placement
    const getArrowStyle = (placement) => {
        const arrowX = middlewareData.arrow?.x;
        const arrowY = middlewareData.arrow?.y;
        const base = {
            position: "absolute",
            left: arrowX != null ? `${arrowX}px` : "",
            top: arrowY != null ? `${arrowY}px` : "",
        };
        if (placement.startsWith("bottom")) {
            return {
                ...base,
                transform: `translate(-50%, 0) rotate(270deg)`,
                left: arrowX != null ? `${arrowX}px` : "50%",
                top: "-23px",
            };
        }
        if (placement.startsWith("top")) {
            return {
                ...base,
                transform: `translate(-50%, 0) rotate(90deg)`,
                left: arrowX != null ? `${arrowX}px` : "50%",
                bottom: "-23px",
                top: "",
            };
        }
        if (placement.startsWith("right")) {
            return {
                ...base,
                transform: `translate(0, -50%) rotate(180deg)`,
                top: arrowY != null ? `${arrowY}px` : "50%",
                left: "-23px",
            };
        }
        if (placement.startsWith("left")) {
            return {
                ...base,
                transform: `translate(0, -50%) rotate(0deg)`,
                top: arrowY != null ? `${arrowY}px` : "50%",
                right: "-23px",
                left: "",
            };
        }
        return base;
    };
    const CardArrow = () => {
        return (_jsx("svg", { ref: arrowRef, viewBox: "0 0 54 54", "data-name": "onborda-arrow", className: "absolute w-6 h-6 origin-center", style: getArrowStyle(finalPlacement), "aria-hidden": "true", children: _jsx("path", { id: "triangle", d: "M27 27L0 0V54L27 27Z", fill: "currentColor" }) }));
    };
    const pointerPadding = activeStep?.pointerPadding ?? 30;
    const pointerPadOffset = pointerPadding / 2;
    const pointerRadius = activeStep?.pointerRadius ?? 28;
    const targetFound = targetStatus === "found" && !!pointerPosition;
    const totalSteps = currentTourSteps?.length ?? 0;
    const isFirstStep = currentStep === 0;
    const isLastStep = currentStep === totalSteps - 1;
    const accessibilityContext = activeStep ? {
        step: activeStep,
        currentStep,
        totalSteps,
        currentTour,
        isFirstStep,
        isLastStep,
        targetFound,
    } : null;
    const defaultProgressText = totalSteps > 0
        ? `Step ${currentStep + 1} of ${totalSteps}`
        : "";
    const progressText = accessibilityContext
        ? resolveA11yText(accessibility?.progressText, accessibilityContext) ?? defaultProgressText
        : defaultProgressText;
    const dialogRole = accessibility?.dialogRole ?? "dialog";
    const ariaModal = accessibility?.ariaModal ?? !interact;
    const resolvedLabelledBy = accessibilityContext
        ? resolveA11yText(accessibility?.ariaLabelledBy, accessibilityContext)
        : undefined;
    const ariaLabelledBy = resolvedLabelledBy === undefined && accessibility?.useCardLabelIds
        ? titleId
        : resolvedLabelledBy ?? undefined;
    const resolvedDescribedBy = accessibilityContext
        ? resolveA11yText(accessibility?.ariaDescribedBy, accessibilityContext)
        : undefined;
    const ariaDescribedBy = resolvedDescribedBy === undefined && accessibility?.useCardLabelIds
        ? descriptionId
        : resolvedDescribedBy ?? undefined;
    const ariaLabel = ariaLabelledBy || !accessibilityContext
        ? undefined
        : resolveA11yText(accessibility?.ariaLabel, accessibilityContext) ?? activeStep?.title;
    const liveRegion = accessibility?.liveRegion ?? "off";
    const cardA11y = {
        dialogId,
        titleId,
        descriptionId,
        progressText,
        titleProps: {
            id: titleId,
        },
        descriptionProps: {
            id: descriptionId,
        },
    };
    const headless = useMemo(() => ({
        progressText,
        canGoNext: totalSteps > 0,
        canGoPrev: currentStep > 0,
        canSkip: true,
        canClose: true,
        isFirstStep,
        isLastStep,
        targetFound,
        getNextButtonProps: (props) => createHeadlessButtonProps(props, nextStep, {
            "aria-label": isLastStep ? "Complete tour" : "Next step",
        }),
        getPrevButtonProps: (props) => createHeadlessButtonProps(props, prevStep, {
            "aria-label": "Previous step",
            disabled: currentStep <= 0,
        }),
        getSkipButtonProps: (props) => createHeadlessButtonProps(props, handleSkip, {
            "aria-label": "Skip tour",
        }),
        getCloseButtonProps: (props) => createHeadlessButtonProps(props, handleClose, {
            "aria-label": "Close tour",
        }),
    }), [
        currentStep,
        handleClose,
        handleSkip,
        isFirstStep,
        isLastStep,
        nextStep,
        prevStep,
        progressText,
        targetFound,
        totalSteps,
    ]);
    const fallbackFloatingStyles = {
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
    };
    return (_jsxs("div", { "data-name": "onborda-wrapper", className: "relative w-full", "data-onborda-debug": debugEnabled ? "true" : undefined, children: [_jsx("div", { "data-name": "onborda-site", className: "block w-full", children: children }), isOnbordaVisible && activeStep && CardComponent && (_jsxs(Portal, { children: [!interact && (_jsx("div", { className: "fixed inset-0 z-[890]", onClick: handleSkip })), _jsxs(motion.svg, { className: "fixed inset-0 w-full h-full z-[900] pointer-events-none", initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: 0.3 }, "aria-hidden": "true", children: [_jsx("defs", { children: _jsxs("mask", { id: maskId, children: [_jsx("rect", { width: "100%", height: "100%", fill: "white" }), pointerPosition && (activeStep.spotlightShape === "circle" ? (_jsx(motion.circle, { cx: pointerPosition.x + pointerPosition.width / 2, cy: pointerPosition.y + pointerPosition.height / 2, r: Math.max(pointerPosition.width, pointerPosition.height) / 2 + pointerPadOffset, fill: "black", transition: cardTransition })) : (_jsx(motion.rect, { x: pointerPosition.x - pointerPadOffset, y: pointerPosition.y - pointerPadOffset, width: pointerPosition.width + pointerPadding, height: pointerPosition.height + pointerPadding, rx: pointerRadius, ry: pointerRadius, fill: "black", transition: cardTransition })))] }) }), _jsx("rect", { width: "100%", height: "100%", fill: `rgba(${shadowRgb}, ${shadowOpacity})`, mask: `url(#${maskId})`, className: "pointer-events-auto" })] }), _jsx(FloatingFocusManager, { context: context, modal: !interact, initialFocus: 0, returnFocus: returnFocusRef, restoreFocus: true, closeOnFocusOut: false, children: _jsx("div", { ref: refs.setFloating, style: {
                                ...(targetFound ? floatingStyles : fallbackFloatingStyles),
                                zIndex: 950,
                            }, className: "absolute flex flex-col pointer-events-auto", "data-name": "onborda-card-wrapper", children: _jsxs("div", { ref: cardRef, className: "flex flex-col max-w-[100%] transition-all min-w-min", "data-name": "onborda-card", id: dialogId, role: dialogRole, "aria-label": ariaLabel ?? undefined, "aria-labelledby": ariaLabelledBy, "aria-describedby": ariaDescribedBy, "aria-modal": ariaModal, tabIndex: -1, children: [liveRegion !== "off" && (_jsx("span", { className: "sr-only", "aria-live": liveRegion, "aria-atomic": "true", children: progressText })), _jsx(CardComponent, { step: activeStep, currentStep: currentStep, totalSteps: totalSteps, nextStep: nextStep, prevStep: prevStep, skipTour: handleSkip, closeOnborda: handleClose, isFirstStep: isFirstStep, isLastStep: isLastStep, targetFound: targetFound, arrow: targetFound ? _jsx(CardArrow, {}) : null, a11y: cardA11y, headless: headless })] }) }) })] }))] }));
};
export default Onborda;
