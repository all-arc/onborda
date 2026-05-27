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
const Onborda = ({ children, interact = false, steps, shadowRgb = "0, 0, 0", shadowOpacity = "0.2", cardTransition = { ease: "anticipate", duration: 0.6 }, cardComponent: CardComponent, targetMissingPolicy = "fallback", onTourStart, onStepChange, onTargetMissing, onTourComplete, onTourSkip, }) => {
    const { currentTour, currentStep, setCurrentStep, isOnbordaVisible, closeOnborda } = useOnborda();
    const currentTourSteps = useMemo(() => steps.find((tour) => tour.tour === currentTour)?.steps, [currentTour, steps]);
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
    const maskId = useId();
    // Route Changes
    const router = useRouter();
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
        const element = document.querySelector(activeStep.selector);
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
        refs,
        restoreActiveElementStyle,
        scrollElementIntoView,
        updatePointerPosition,
    ]);
    const scrollToElement = useCallback((stepIndex) => {
        if (!currentTourSteps)
            return;
        const element = document.querySelector(currentTourSteps[stepIndex].selector);
        if (!element) {
            setPointerPosition(null);
            return;
        }
        scrollElementIntoView(element);
        updatePointerPosition(element);
    }, [currentTourSteps, scrollElementIntoView, updatePointerPosition]);
    // Lifecycle wrappers
    const handleComplete = useCallback(() => {
        if (currentTour) {
            if (onTourComplete)
                onTourComplete(currentTour);
        }
        cleanupMutationObserver();
        closeOnborda();
    }, [cleanupMutationObserver, closeOnborda, currentTour, onTourComplete]);
    const handleSkip = useCallback(() => {
        if (currentTour) {
            if (onTourSkip)
                onTourSkip(currentTour, currentStep);
        }
        cleanupMutationObserver();
        closeOnborda();
    }, [cleanupMutationObserver, closeOnborda, currentStep, currentTour, onTourSkip]);
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
            }
        }
        else {
            tourStartedRef.current = null;
        }
    }, [currentTour, isOnbordaVisible, onTourStart]);
    // 2. Lifecycle Hook: onStepChange
    const lastFiredStepRef = useRef(null);
    useEffect(() => {
        if (isOnbordaVisible && currentTour && currentTourSteps) {
            const step = currentTourSteps[currentStep];
            if (step && lastFiredStepRef.current !== currentStep) {
                lastFiredStepRef.current = currentStep;
                if (onStepChange)
                    onStepChange(currentTour, currentStep, step);
            }
        }
        else {
            lastFiredStepRef.current = null;
        }
    }, [currentStep, currentTour, currentTourSteps, isOnbordaVisible, onStepChange]);
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
    const waitForRouteTarget = useCallback((stepIndex) => {
        if (!currentTourSteps)
            return;
        const targetSelector = currentTourSteps[stepIndex].selector;
        const showStep = () => {
            setCurrentStep(stepIndex);
            scrollToElement(stepIndex);
        };
        if (document.querySelector(targetSelector)) {
            showStep();
            return;
        }
        const observer = new MutationObserver((_, obs) => {
            if (!document.querySelector(targetSelector))
                return;
            if (mutationTimeoutRef.current) {
                clearTimeout(mutationTimeoutRef.current);
                mutationTimeoutRef.current = null;
            }
            showStep();
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
            setCurrentStep(stepIndex);
        }, 5000);
    }, [cleanupMutationObserver, currentTourSteps, scrollToElement, setCurrentStep]);
    // Step Controls
    const nextStep = useCallback(async () => {
        if (!currentTourSteps)
            return;
        if (currentStep < currentTourSteps.length - 1) {
            try {
                const nextStepIndex = currentStep + 1;
                const route = currentTourSteps[currentStep].nextRoute;
                navigationDirectionRef.current = "forward";
                cleanupMutationObserver();
                if (route) {
                    await router.push(route);
                    waitForRouteTarget(nextStepIndex);
                }
                else {
                    setCurrentStep(nextStepIndex);
                    scrollToElement(nextStepIndex);
                }
            }
            catch (error) {
                console.error("Error navigating to next route", error);
            }
        }
        else {
            handleComplete();
        }
    }, [
        cleanupMutationObserver,
        currentStep,
        currentTourSteps,
        handleComplete,
        router,
        scrollToElement,
        setCurrentStep,
        waitForRouteTarget,
    ]);
    const prevStep = useCallback(async () => {
        if (!currentTourSteps || currentStep <= 0)
            return;
        try {
            const prevStepIndex = currentStep - 1;
            const route = currentTourSteps[currentStep].prevRoute;
            navigationDirectionRef.current = "backward";
            cleanupMutationObserver();
            if (route) {
                await router.push(route);
                waitForRouteTarget(prevStepIndex);
            }
            else {
                setCurrentStep(prevStepIndex);
                scrollToElement(prevStepIndex);
            }
        }
        catch (error) {
            console.error("Error navigating to previous route", error);
        }
    }, [
        cleanupMutationObserver,
        currentStep,
        currentTourSteps,
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
        onTargetMissing?.(currentTour, currentStep, activeStep);
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
        handleSkip,
        isOnbordaVisible,
        onTargetMissing,
        skipMissingStep,
        targetMissingPolicy,
        targetStatus,
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
    const fallbackFloatingStyles = {
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
    };
    return (_jsxs("div", { "data-name": "onborda-wrapper", className: "relative w-full", "data-onborda": "dev", children: [_jsx("div", { "data-name": "onborda-site", className: "block w-full", children: children }), isOnbordaVisible && activeStep && CardComponent && (_jsxs(Portal, { children: [!interact && (_jsx("div", { className: "fixed inset-0 z-[890]", onClick: handleSkip })), _jsxs(motion.svg, { className: "fixed inset-0 w-full h-full z-[900] pointer-events-none", initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: 0.3 }, "aria-hidden": "true", children: [_jsx("defs", { children: _jsxs("mask", { id: maskId, children: [_jsx("rect", { width: "100%", height: "100%", fill: "white" }), pointerPosition && (activeStep.spotlightShape === "circle" ? (_jsx(motion.circle, { cx: pointerPosition.x + pointerPosition.width / 2, cy: pointerPosition.y + pointerPosition.height / 2, r: Math.max(pointerPosition.width, pointerPosition.height) / 2 + pointerPadOffset, fill: "black", transition: cardTransition })) : (_jsx(motion.rect, { x: pointerPosition.x - pointerPadOffset, y: pointerPosition.y - pointerPadOffset, width: pointerPosition.width + pointerPadding, height: pointerPosition.height + pointerPadding, rx: pointerRadius, ry: pointerRadius, fill: "black", transition: cardTransition })))] }) }), _jsx("rect", { width: "100%", height: "100%", fill: `rgba(${shadowRgb}, ${shadowOpacity})`, mask: `url(#${maskId})`, className: "pointer-events-auto" })] }), _jsx(FloatingFocusManager, { context: context, modal: !interact, initialFocus: 0, returnFocus: returnFocusRef, restoreFocus: true, closeOnFocusOut: false, children: _jsx("div", { ref: refs.setFloating, style: {
                                ...(targetFound ? floatingStyles : fallbackFloatingStyles),
                                zIndex: 950,
                            }, className: "absolute flex flex-col pointer-events-auto", "data-name": "onborda-card-wrapper", children: _jsx("div", { ref: cardRef, className: "flex flex-col max-w-[100%] transition-all min-w-min", "data-name": "onborda-card", role: "dialog", "aria-label": activeStep.title, tabIndex: -1, children: _jsx(CardComponent, { step: activeStep, currentStep: currentStep, totalSteps: currentTourSteps?.length ?? 0, nextStep: nextStep, prevStep: prevStep, skipTour: handleSkip, closeOnborda: handleClose, isFirstStep: currentStep === 0, isLastStep: currentStep === (currentTourSteps?.length ?? 0) - 1, targetFound: targetFound, arrow: targetFound ? _jsx(CardArrow, {}) : null }) }) }) })] }))] }));
};
export default Onborda;
