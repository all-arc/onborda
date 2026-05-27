import { Transition } from "framer-motion";
export interface OnbordaContextType {
    currentStep: number;
    currentTour: string | null;
    setCurrentStep: (step: number, delay?: number) => void;
    closeOnborda: () => void;
    startOnborda: (tourName: string) => void;
    clearPersistedProgress: () => void;
    registeredTours: Tour[];
    registerTour: (tour: Tour) => () => void;
    registerTours: (tours: Tour[]) => () => void;
    unregisterTour: (tourName: string) => void;
    isOnbordaVisible: boolean;
}
export interface OnbordaState {
    currentTour: string | null;
    currentStep: number;
    isOnbordaVisible: boolean;
}
export interface OnbordaPersistedProgress extends OnbordaState {
    version: 1;
    updatedAt: number;
}
export interface OnbordaProgressStorage {
    getItem: (key: string) => string | null;
    setItem: (key: string, value: string) => void;
    removeItem: (key: string) => void;
}
export interface OnbordaProgressPersistenceOptions {
    storageKey?: string;
    storage?: OnbordaProgressStorage;
    restore?: boolean;
}
export type OnbordaProgressPersistence = boolean | OnbordaProgressPersistenceOptions;
export interface OnbordaProviderProps {
    children: React.ReactNode;
    initialTours?: Tour[];
    currentTour?: string | null;
    currentStep?: number;
    isOnbordaVisible?: boolean;
    defaultCurrentTour?: string | null;
    defaultCurrentStep?: number;
    defaultIsOnbordaVisible?: boolean;
    progressPersistence?: OnbordaProgressPersistence;
    onCurrentTourChange?: (tour: string | null) => void;
    onCurrentStepChange?: (step: number) => void;
    onOpenChange?: (open: boolean) => void;
    onStateChange?: (state: OnbordaState) => void;
}
export interface StepConditionContext {
    tour: string;
    step: Step;
    stepIndex: number;
}
export type StepCondition = boolean | ((context: StepConditionContext) => boolean);
export type OnbordaPlacementSide = "top" | "bottom" | "left" | "right" | "top-left" | "top-right" | "bottom-left" | "bottom-right" | "left-top" | "left-bottom" | "right-top" | "right-bottom";
export type OnbordaMobilePlacementPreset = "auto" | "top" | "bottom" | "center";
export interface OnbordaMobilePlacementOptions {
    breakpoint?: number;
    placement?: OnbordaPlacementSide | OnbordaMobilePlacementPreset;
    fallbackPlacements?: OnbordaPlacementSide[];
    offset?: number;
    shiftPadding?: number;
}
export type OnbordaMobilePlacement = OnbordaMobilePlacementPreset | OnbordaMobilePlacementOptions;
export interface Step {
    icon?: React.ReactNode | string | null;
    title: string;
    content: React.ReactNode;
    selector: string;
    side?: OnbordaPlacementSide;
    mobileSide?: OnbordaPlacementSide | OnbordaMobilePlacementPreset;
    showControls?: boolean;
    pointerPadding?: number;
    pointerRadius?: number;
    spotlightShape?: "rect" | "circle";
    when?: StepCondition;
    nextRoute?: string;
    prevRoute?: string;
}
export interface Tour {
    tour: string;
    steps: Step[];
}
export type TourResolver = () => Tour[] | Promise<Tour[]>;
export type TargetMissingPolicy = "fallback" | "skip-step" | "skip-tour";
export type RouteTransitionDirection = "next" | "prev";
export interface RouteTransition {
    tour: string;
    fromStepIndex: number;
    toStepIndex: number;
    fromStep: Step;
    toStep: Step;
    route: string;
    direction: RouteTransitionDirection;
}
export interface RouteTransitionComplete extends RouteTransition {
    targetFound: boolean;
}
export interface OnbordaAccessibilityContext {
    step: Step;
    currentStep: number;
    totalSteps: number;
    currentTour: string | null;
    isFirstStep: boolean;
    isLastStep: boolean;
    targetFound: boolean;
}
export type OnbordaA11yText = string | null | ((context: OnbordaAccessibilityContext) => string | null | undefined);
export interface OnbordaAccessibilityOptions {
    dialogRole?: "dialog" | "alertdialog";
    ariaLabel?: OnbordaA11yText;
    ariaLabelledBy?: OnbordaA11yText;
    ariaDescribedBy?: OnbordaA11yText;
    ariaModal?: boolean;
    useCardLabelIds?: boolean;
    progressText?: OnbordaA11yText;
    liveRegion?: "off" | "polite" | "assertive";
}
export interface OnbordaCardAccessibilityProps {
    dialogId: string;
    titleId: string;
    descriptionId: string;
    progressText: string;
    titleProps: {
        id: string;
    };
    descriptionProps: {
        id: string;
    };
}
export type OnbordaHeadlessButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>;
export interface OnbordaHeadlessHelpers {
    progressText: string;
    canGoNext: boolean;
    canGoPrev: boolean;
    canSkip: boolean;
    canClose: boolean;
    isFirstStep: boolean;
    isLastStep: boolean;
    targetFound: boolean;
    getNextButtonProps: (props?: OnbordaHeadlessButtonProps) => OnbordaHeadlessButtonProps;
    getPrevButtonProps: (props?: OnbordaHeadlessButtonProps) => OnbordaHeadlessButtonProps;
    getSkipButtonProps: (props?: OnbordaHeadlessButtonProps) => OnbordaHeadlessButtonProps;
    getCloseButtonProps: (props?: OnbordaHeadlessButtonProps) => OnbordaHeadlessButtonProps;
}
export type OnbordaAnalyticsEventType = "tour_start" | "tour_complete" | "tour_skip" | "step_change" | "step_next" | "step_prev" | "target_missing" | "route_transition_start" | "route_transition_complete" | "route_transition_timeout" | "route_transition_error" | "steps_load_start" | "steps_load_success" | "steps_load_error";
export interface OnbordaAnalyticsEvent {
    type: OnbordaAnalyticsEventType;
    tour?: string | null;
    stepIndex?: number;
    step?: Step;
    totalSteps?: number;
    routeTransition?: RouteTransition | RouteTransitionComplete;
    error?: unknown;
    timestamp: number;
}
export type OnbordaDebugEventType = "analytics" | "dev_warning" | "target" | "steps";
export interface OnbordaDebugEvent {
    type: OnbordaDebugEventType;
    message: string;
    data?: unknown;
    timestamp: number;
}
export interface OnbordaDebugOptions {
    enabled?: boolean;
    log?: boolean;
    onEvent?: (event: OnbordaDebugEvent) => void;
}
export interface OnbordaProps {
    children: React.ReactNode;
    interact?: boolean;
    steps?: Tour[] | TourResolver;
    showOnborda?: boolean;
    shadowRgb?: string;
    shadowOpacity?: string;
    cardTransition?: Transition;
    cardComponent: React.ComponentType<CardComponentProps>;
    targetMissingPolicy?: TargetMissingPolicy;
    accessibility?: OnbordaAccessibilityOptions;
    mobilePlacement?: OnbordaMobilePlacement;
    devWarnings?: boolean;
    debug?: boolean | OnbordaDebugOptions;
    onTourStart?: (tour: string) => void;
    onStepChange?: (tour: string, stepIndex: number, step: Step) => void;
    onTargetMissing?: (tour: string, stepIndex: number, step: Step) => void;
    onRouteTransitionStart?: (transition: RouteTransition) => void;
    onRouteTransitionComplete?: (transition: RouteTransitionComplete) => void;
    onRouteTransitionTimeout?: (transition: RouteTransition) => void;
    onRouteTransitionError?: (transition: RouteTransition, error: unknown) => void;
    onStepsLoadStart?: () => void;
    onStepsLoadSuccess?: (tours: Tour[]) => void;
    onStepsLoadError?: (error: unknown) => void;
    onAnalyticsEvent?: (event: OnbordaAnalyticsEvent) => void;
    onTourComplete?: (tour: string) => void;
    onTourSkip?: (tour: string, currentStep: number) => void;
}
export interface CardComponentProps {
    step: Step;
    currentStep: number;
    totalSteps: number;
    nextStep: () => void;
    prevStep: () => void;
    skipTour: () => void;
    closeOnborda: () => void;
    isFirstStep: boolean;
    isLastStep: boolean;
    targetFound: boolean;
    arrow?: React.ReactElement | null;
    a11y: OnbordaCardAccessibilityProps;
    headless: OnbordaHeadlessHelpers;
}
