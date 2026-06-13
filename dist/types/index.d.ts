import { Transition } from "framer-motion";
export interface OkidoContextType {
    currentStep: number;
    currentTour: string | null;
    setCurrentStep: (step: number, delay?: number) => void;
    closeOkido: () => void;
    startOkido: (tourName: string) => void;
    clearPersistedProgress: () => void;
    registeredTours: Tour[];
    registerTour: (tour: Tour) => () => void;
    registerTours: (tours: Tour[]) => () => void;
    unregisterTour: (tourName: string) => void;
    isOkidoVisible: boolean;
}
export interface OkidoState {
    currentTour: string | null;
    currentStep: number;
    isOkidoVisible: boolean;
}
export interface OkidoPersistedProgress extends OkidoState {
    version: 1;
    updatedAt: number;
}
export interface OkidoProgressStorage {
    getItem: (key: string) => string | null;
    setItem: (key: string, value: string) => void;
    removeItem: (key: string) => void;
}
export interface OkidoProgressPersistenceOptions {
    storageKey?: string;
    storage?: OkidoProgressStorage;
    restore?: boolean;
}
export type OkidoProgressPersistence = boolean | OkidoProgressPersistenceOptions;
export interface OkidoProviderProps {
    children: React.ReactNode;
    initialTours?: Tour[];
    currentTour?: string | null;
    currentStep?: number;
    isOkidoVisible?: boolean;
    defaultCurrentTour?: string | null;
    defaultCurrentStep?: number;
    defaultIsOkidoVisible?: boolean;
    progressPersistence?: OkidoProgressPersistence;
    onCurrentTourChange?: (tour: string | null) => void;
    onCurrentStepChange?: (step: number) => void;
    onOpenChange?: (open: boolean) => void;
    onStateChange?: (state: OkidoState) => void;
}
export interface StepConditionContext {
    tour: string;
    step: Step;
    stepIndex: number;
}
export type StepCondition = boolean | ((context: StepConditionContext) => boolean);
export type OkidoPlacementSide = "top" | "bottom" | "left" | "right" | "top-left" | "top-right" | "bottom-left" | "bottom-right" | "left-top" | "left-bottom" | "right-top" | "right-bottom";
export type OkidoMobilePlacementPreset = "auto" | "top" | "bottom" | "center";
export interface OkidoMobilePlacementOptions {
    breakpoint?: number;
    placement?: OkidoPlacementSide | OkidoMobilePlacementPreset;
    fallbackPlacements?: OkidoPlacementSide[];
    offset?: number;
    shiftPadding?: number;
}
export type OkidoMobilePlacement = OkidoMobilePlacementPreset | OkidoMobilePlacementOptions;
export interface Step {
    icon?: React.ReactNode | string | null;
    title: string;
    content: React.ReactNode;
    selector: string;
    side?: OkidoPlacementSide;
    mobileSide?: OkidoPlacementSide | OkidoMobilePlacementPreset;
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
export interface OkidoAccessibilityContext {
    step: Step;
    currentStep: number;
    totalSteps: number;
    currentTour: string | null;
    isFirstStep: boolean;
    isLastStep: boolean;
    targetFound: boolean;
}
export type OkidoA11yText = string | null | ((context: OkidoAccessibilityContext) => string | null | undefined);
export interface OkidoAccessibilityOptions {
    dialogRole?: "dialog" | "alertdialog";
    ariaLabel?: OkidoA11yText;
    ariaLabelledBy?: OkidoA11yText;
    ariaDescribedBy?: OkidoA11yText;
    ariaModal?: boolean;
    useCardLabelIds?: boolean;
    progressText?: OkidoA11yText;
    liveRegion?: "off" | "polite" | "assertive";
}
export interface OkidoCardAccessibilityProps {
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
export type OkidoHeadlessButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>;
export interface OkidoHeadlessHelpers {
    progressText: string;
    canGoNext: boolean;
    canGoPrev: boolean;
    canSkip: boolean;
    canClose: boolean;
    isFirstStep: boolean;
    isLastStep: boolean;
    targetFound: boolean;
    getNextButtonProps: (props?: OkidoHeadlessButtonProps) => OkidoHeadlessButtonProps;
    getPrevButtonProps: (props?: OkidoHeadlessButtonProps) => OkidoHeadlessButtonProps;
    getSkipButtonProps: (props?: OkidoHeadlessButtonProps) => OkidoHeadlessButtonProps;
    getCloseButtonProps: (props?: OkidoHeadlessButtonProps) => OkidoHeadlessButtonProps;
}
export type OkidoAnalyticsEventType = "tour_start" | "tour_complete" | "tour_skip" | "step_change" | "step_next" | "step_prev" | "target_missing" | "route_transition_start" | "route_transition_complete" | "route_transition_timeout" | "route_transition_error" | "steps_load_start" | "steps_load_success" | "steps_load_error";
export interface OkidoAnalyticsEvent {
    type: OkidoAnalyticsEventType;
    tour?: string | null;
    stepIndex?: number;
    step?: Step;
    totalSteps?: number;
    routeTransition?: RouteTransition | RouteTransitionComplete;
    error?: unknown;
    timestamp: number;
}
export type OkidoDebugEventType = "analytics" | "dev_warning" | "target" | "steps";
export interface OkidoDebugEvent {
    type: OkidoDebugEventType;
    message: string;
    data?: unknown;
    timestamp: number;
}
export interface OkidoDebugOptions {
    enabled?: boolean;
    log?: boolean;
    onEvent?: (event: OkidoDebugEvent) => void;
}
export interface OkidoProps {
    children: React.ReactNode;
    interact?: boolean;
    steps?: Tour[] | TourResolver;
    showOkido?: boolean;
    shadowRgb?: string;
    shadowOpacity?: string;
    cardTransition?: Transition;
    cardComponent: React.ComponentType<CardComponentProps>;
    targetMissingPolicy?: TargetMissingPolicy;
    accessibility?: OkidoAccessibilityOptions;
    mobilePlacement?: OkidoMobilePlacement;
    devWarnings?: boolean;
    debug?: boolean | OkidoDebugOptions;
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
    onAnalyticsEvent?: (event: OkidoAnalyticsEvent) => void;
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
    closeOkido: () => void;
    isFirstStep: boolean;
    isLastStep: boolean;
    targetFound: boolean;
    arrow?: React.ReactElement | null;
    a11y: OkidoCardAccessibilityProps;
    headless: OkidoHeadlessHelpers;
}
