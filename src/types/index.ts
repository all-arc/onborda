import { Transition } from "framer-motion";

// Context
export interface OnbordaContextType {
  currentStep: number;
  currentTour: string | null;
  setCurrentStep: (step: number, delay?: number) => void;
  closeOnborda: () => void;
  startOnborda: (tourName: string) => void;
  clearPersistedProgress: () => void;
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

export type OnbordaProgressPersistence =
  | boolean
  | OnbordaProgressPersistenceOptions;

export interface OnbordaProviderProps {
  children: React.ReactNode;
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

// Step
export interface Step {
  // Step Content
  icon?: React.ReactNode | string | null;
  title: string;
  content: React.ReactNode;
  selector: string;
  // Options
  side?: "top" | "bottom" | "left" | "right" | "top-left" | "top-right" | "bottom-left" | "bottom-right" | "left-top" | "left-bottom" | "right-top" | "right-bottom";
  showControls?: boolean;
  pointerPadding?: number;
  pointerRadius?: number;
  spotlightShape?: "rect" | "circle";
  // Routing
  nextRoute?: string;
  prevRoute?: string;
}

// Tour
// 
export interface Tour {
  tour: string;
  steps: Step[];
}

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

// Onborda
export interface OnbordaProps {
  children: React.ReactNode;
  interact?: boolean;
  steps: Tour[];
  showOnborda?: boolean;
  shadowRgb?: string;
  shadowOpacity?: string;
  cardTransition?: Transition;
  cardComponent: React.ComponentType<CardComponentProps>;
  targetMissingPolicy?: TargetMissingPolicy;
  // Callbacks
  onTourStart?: (tour: string) => void;
  onStepChange?: (tour: string, stepIndex: number, step: Step) => void;
  onTargetMissing?: (tour: string, stepIndex: number, step: Step) => void;
  onRouteTransitionStart?: (transition: RouteTransition) => void;
  onRouteTransitionComplete?: (transition: RouteTransitionComplete) => void;
  onRouteTransitionTimeout?: (transition: RouteTransition) => void;
  onRouteTransitionError?: (transition: RouteTransition, error: unknown) => void;
  onTourComplete?: (tour: string) => void;
  onTourSkip?: (tour: string, currentStep: number) => void;
}

// Custom Card
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
}
