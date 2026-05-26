"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useRef } from "react";
import { useOnborda } from "./OnbordaContext";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Portal } from "@radix-ui/react-portal";
import { useFloating, offset as floatingOffset, flip, shift, arrow, autoUpdate } from "@floating-ui/react";
const Onborda = ({ children, interact = false, steps, shadowRgb = "0, 0, 0", shadowOpacity = "0.2", cardTransition = { ease: "anticipate", duration: 0.6 }, cardComponent: CardComponent, onTourStart, onStepChange, onTourComplete, onTourSkip, }) => {
    const { currentTour, currentStep, setCurrentStep, isOnbordaVisible, closeOnborda } = useOnborda();
    const currentTourSteps = steps.find((tour) => tour.tour === currentTour)?.steps;
    const [pointerPosition, setPointerPosition] = useState(null);
    const currentElementRef = useRef(null);
    const resizeAnimationFrameRef = useRef(null);
    const mutationObserverRef = useRef(null);
    const mutationTimeoutRef = useRef(null);
    const cardRef = useRef(null);
    const arrowRef = useRef(null);
    const offset = 20;
    // Route Changes
    const router = useRouter();
    // Floating UI Setup
    const side = currentTourSteps?.[currentStep]?.side || "bottom";
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
    const placement = (placementMap[side] || "bottom");
    const { refs, floatingStyles, middlewareData, placement: finalPlacement } = useFloating({
        placement,
        whileElementsMounted: autoUpdate,
        open: isOnbordaVisible && !!pointerPosition,
        middleware: [
            floatingOffset(25),
            flip({
                fallbackPlacements: ["bottom", "top", "right", "left"],
            }),
            shift({ padding: 10 }),
            arrow({ element: arrowRef }),
        ],
    });
    // Helper function to get element position
    const getElementPosition = (element) => {
        const { top, left, width, height } = element.getBoundingClientRect();
        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        const scrollLeft = window.scrollX || document.documentElement.scrollLeft;
        return {
            x: left + scrollLeft,
            y: top + scrollTop,
            width,
            height,
        };
    };
    // Safe wrapper to update pointer position
    const updatePointerPosition = () => {
        if (currentTourSteps) {
            const step = currentTourSteps[currentStep];
            if (step) {
                const element = document.querySelector(step.selector);
                if (element) {
                    setPointerPosition(getElementPosition(element));
                }
            }
        }
    };
    // Lifecycle wrappers
    const handleComplete = () => {
        if (currentTour) {
            if (onTourComplete)
                onTourComplete(currentTour);
        }
        closeOnborda();
    };
    const handleSkip = () => {
        if (currentTour) {
            if (onTourSkip)
                onTourSkip(currentTour, currentStep);
        }
        closeOnborda();
    };
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
    // Unified Effect for target element tracking, styles, and initial scroll
    useEffect(() => {
        if (isOnbordaVisible && currentTourSteps) {
            // 1. Reset styles for all non-active elements
            currentTourSteps.forEach((tourStep) => {
                const element = document.querySelector(tourStep.selector);
                if (element && tourStep !== currentTourSteps[currentStep]) {
                    if (interact) {
                        element.style.position = '';
                        element.style.zIndex = '';
                    }
                }
            });
            // 2. Set up current active element
            const step = currentTourSteps[currentStep];
            if (step) {
                const element = document.querySelector(step.selector);
                if (element) {
                    element.style.position = 'relative';
                    if (interact) {
                        element.style.zIndex = '990';
                    }
                    // Set pointer position and track element
                    const position = getElementPosition(element);
                    setPointerPosition(position);
                    currentElementRef.current = element;
                    refs.setReference(element);
                    // Scroll into view if not fully inside viewport
                    const rect = element.getBoundingClientRect();
                    const isInViewport = rect.top >= -offset && rect.bottom <= window.innerHeight + offset;
                    if (!isInViewport) {
                        element.scrollIntoView({ behavior: "smooth", block: "center" });
                    }
                }
                else {
                    setPointerPosition(null);
                    currentElementRef.current = null;
                    refs.setReference(null);
                }
            }
        }
        // Cleanup function for unmount or step changes
        return () => {
            if (currentTourSteps) {
                currentTourSteps.forEach((step) => {
                    const element = document.querySelector(step.selector);
                    if (element && interact) {
                        element.style.position = '';
                        element.style.zIndex = '';
                    }
                });
            }
        };
    }, [currentStep, currentTourSteps, offset, isOnbordaVisible, interact, refs]);
    // Effect for Throttled Resize, Scroll & ResizeObserver tracking
    useEffect(() => {
        const activeElement = currentElementRef.current;
        if (!isOnbordaVisible || !activeElement)
            return;
        const handleTracking = () => {
            if (resizeAnimationFrameRef.current) {
                cancelAnimationFrame(resizeAnimationFrameRef.current);
            }
            resizeAnimationFrameRef.current = requestAnimationFrame(() => {
                updatePointerPosition();
            });
        };
        // 1. Watch element size changes (ResizeObserver)
        const resizeObserver = new ResizeObserver(() => {
            handleTracking();
        });
        resizeObserver.observe(activeElement);
        // 2. Watch window resize & scroll changes (capture scroll to support nested panels)
        window.addEventListener("resize", handleTracking);
        window.addEventListener("scroll", handleTracking, { capture: true, passive: true });
        return () => {
            resizeObserver.disconnect();
            window.removeEventListener("resize", handleTracking);
            window.removeEventListener("scroll", handleTracking, { capture: true });
            if (resizeAnimationFrameRef.current) {
                cancelAnimationFrame(resizeAnimationFrameRef.current);
            }
        };
    }, [currentStep, currentTourSteps, isOnbordaVisible]);
    // keydown navigation hook & Focus Trap focus setter
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
                    e.preventDefault();
                    nextStep();
                    break;
                case "ArrowLeft":
                    e.preventDefault();
                    prevStep();
                    break;
                case "Tab":
                    handleFocusTrap(e);
                    break;
                default:
                    break;
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOnbordaVisible, currentStep, currentTourSteps]);
    // Focus trap implementation
    const handleFocusTrap = (e) => {
        if (!cardRef.current)
            return;
        const focusableElements = cardRef.current.querySelectorAll('a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, object, embed, [tabindex="0"], [contenteditable]');
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        if (focusableElements.length === 0) {
            e.preventDefault();
            return;
        }
        if (e.shiftKey) {
            if (document.activeElement === firstElement) {
                lastElement.focus();
                e.preventDefault();
            }
        }
        else {
            if (document.activeElement === lastElement) {
                firstElement.focus();
                e.preventDefault();
            }
        }
    };
    // Auto focus card on mount/step change
    useEffect(() => {
        if (isOnbordaVisible && cardRef.current) {
            const focusableElements = cardRef.current.querySelectorAll('a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, object, embed, [tabindex="0"], [contenteditable]');
            if (focusableElements.length > 0) {
                focusableElements[0].focus();
            }
        }
    }, [currentStep, isOnbordaVisible]);
    // Clean up mutation observers and timers on unmount
    useEffect(() => {
        return () => {
            if (mutationObserverRef.current) {
                mutationObserverRef.current.disconnect();
            }
            if (mutationTimeoutRef.current) {
                clearTimeout(mutationTimeoutRef.current);
            }
        };
    }, []);
    // Step Controls
    const nextStep = async () => {
        if (currentTourSteps) {
            if (currentStep < currentTourSteps.length - 1) {
                try {
                    const nextStepIndex = currentStep + 1;
                    const route = currentTourSteps[currentStep].nextRoute;
                    if (mutationObserverRef.current) {
                        mutationObserverRef.current.disconnect();
                    }
                    if (mutationTimeoutRef.current) {
                        clearTimeout(mutationTimeoutRef.current);
                    }
                    if (route) {
                        await router.push(route);
                        const targetSelector = currentTourSteps[nextStepIndex].selector;
                        const observer = new MutationObserver((mutations, obs) => {
                            const element = document.querySelector(targetSelector);
                            if (element) {
                                if (mutationTimeoutRef.current) {
                                    clearTimeout(mutationTimeoutRef.current);
                                }
                                setCurrentStep(nextStepIndex);
                                scrollToElement(nextStepIndex);
                                obs.disconnect();
                                mutationObserverRef.current = null;
                            }
                        });
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
                        }, 5000);
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
        }
    };
    const prevStep = async () => {
        if (currentTourSteps && currentStep > 0) {
            try {
                const prevStepIndex = currentStep - 1;
                const route = currentTourSteps[currentStep].prevRoute;
                if (mutationObserverRef.current) {
                    mutationObserverRef.current.disconnect();
                    mutationObserverRef.current = null;
                }
                if (mutationTimeoutRef.current) {
                    clearTimeout(mutationTimeoutRef.current);
                    mutationTimeoutRef.current = null;
                }
                if (route) {
                    await router.push(route);
                    const targetSelector = currentTourSteps[prevStepIndex].selector;
                    const observer = new MutationObserver((mutations, obs) => {
                        const element = document.querySelector(targetSelector);
                        if (element) {
                            if (mutationTimeoutRef.current) {
                                clearTimeout(mutationTimeoutRef.current);
                            }
                            setCurrentStep(prevStepIndex);
                            scrollToElement(prevStepIndex);
                            obs.disconnect();
                            mutationObserverRef.current = null;
                        }
                    });
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
                    }, 5000);
                }
                else {
                    setCurrentStep(prevStepIndex);
                    scrollToElement(prevStepIndex);
                }
            }
            catch (error) {
                console.error("Error navigating to previous route", error);
            }
        }
    };
    // Scroll to the correct element when the step changes
    const scrollToElement = (stepIndex) => {
        if (currentTourSteps) {
            const element = document.querySelector(currentTourSteps[stepIndex].selector);
            if (element) {
                const { top } = element.getBoundingClientRect();
                const isInViewport = top >= -offset && top <= window.innerHeight + offset;
                if (!isInViewport) {
                    element.scrollIntoView({ behavior: "smooth", block: "center" });
                }
                setPointerPosition(getElementPosition(element));
            }
        }
    };
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
        return (_jsx("svg", { ref: arrowRef, viewBox: "0 0 54 54", "data-name": "onborda-arrow", className: "absolute w-6 h-6 origin-center", style: getArrowStyle(finalPlacement), children: _jsx("path", { id: "triangle", d: "M27 27L0 0V54L27 27Z", fill: "currentColor" }) }));
    };
    const pointerPadding = currentTourSteps?.[currentStep]?.pointerPadding ?? 30;
    const pointerPadOffset = pointerPadding / 2;
    const pointerRadius = currentTourSteps?.[currentStep]?.pointerRadius ?? 28;
    return (_jsxs("div", { "data-name": "onborda-wrapper", className: "relative w-full", "data-onborda": "dev", children: [_jsx("div", { "data-name": "onborda-site", className: "block w-full", children: children }), pointerPosition && isOnbordaVisible && CardComponent && (_jsxs(Portal, { children: [!interact && (_jsx("div", { className: "fixed inset-0 z-[890]", onClick: handleSkip })), _jsxs(motion.svg, { className: "fixed inset-0 w-full h-full z-[900] pointer-events-none", initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: 0.3 }, children: [_jsx("defs", { children: _jsxs("mask", { id: "onborda-spotlight-mask", children: [_jsx("rect", { width: "100%", height: "100%", fill: "white" }), currentTourSteps?.[currentStep]?.spotlightShape === "circle" ? (_jsx(motion.circle, { cx: pointerPosition.x - window.scrollX + pointerPosition.width / 2, cy: pointerPosition.y - window.scrollY + pointerPosition.height / 2, r: Math.max(pointerPosition.width, pointerPosition.height) / 2 + pointerPadOffset, fill: "black", transition: cardTransition })) : (_jsx(motion.rect, { x: pointerPosition.x - window.scrollX - pointerPadOffset, y: pointerPosition.y - window.scrollY - pointerPadOffset, width: pointerPosition.width + pointerPadding, height: pointerPosition.height + pointerPadding, rx: pointerRadius, ry: pointerRadius, fill: "black", transition: cardTransition }))] }) }), _jsx("rect", { width: "100%", height: "100%", fill: `rgba(${shadowRgb}, ${shadowOpacity})`, mask: "url(#onborda-spotlight-mask)", className: "pointer-events-auto" })] }), _jsx("div", { ref: refs.setFloating, style: {
                            ...floatingStyles,
                            zIndex: 950,
                        }, className: "absolute flex flex-col pointer-events-auto", "data-name": "onborda-card-wrapper", children: _jsx("div", { ref: cardRef, className: "flex flex-col max-w-[100%] transition-all min-w-min", "data-name": "onborda-card", children: _jsx(CardComponent, { step: currentTourSteps?.[currentStep], currentStep: currentStep, totalSteps: currentTourSteps?.length ?? 0, nextStep: nextStep, prevStep: prevStep, arrow: _jsx(CardArrow, {}) }) }) })] }))] }));
};
export default Onborda;
