import React from "react";
import { describe, expectTypeOf, it } from "vitest";
import type {
  CardComponentProps,
  OnbordaAccessibilityContext,
  OnbordaAccessibilityOptions,
  OnbordaCardAccessibilityProps,
  OnbordaPersistedProgress,
  OnbordaProgressPersistence,
  OnbordaProgressStorage,
  OnbordaProps,
  OnbordaProviderProps,
  OnbordaState,
  RouteTransition,
  RouteTransitionComplete,
  RouteTransitionDirection,
  TargetMissingPolicy,
} from "./types";

function Card(_: CardComponentProps) {
  return null;
}

describe("public types", () => {
  it("requires a card component and exposes expanded card props", () => {
    expectTypeOf<CardComponentProps>().toMatchTypeOf<{
      skipTour: () => void;
      closeOnborda: () => void;
      isFirstStep: boolean;
      isLastStep: boolean;
      targetFound: boolean;
      arrow?: React.ReactElement | null;
      a11y: OnbordaCardAccessibilityProps;
    }>();

    expectTypeOf<OnbordaProps>().toMatchTypeOf<{
      cardComponent: React.ComponentType<CardComponentProps>;
      targetMissingPolicy?: TargetMissingPolicy;
      accessibility?: OnbordaAccessibilityOptions;
      onTargetMissing?: OnbordaProps["onTargetMissing"];
      onRouteTransitionStart?: (transition: RouteTransition) => void;
      onRouteTransitionComplete?: (transition: RouteTransitionComplete) => void;
      onRouteTransitionTimeout?: (transition: RouteTransition) => void;
      onRouteTransitionError?: (transition: RouteTransition, error: unknown) => void;
    }>();

    const props = {
      children: null,
      steps: [],
      cardComponent: Card,
    } satisfies OnbordaProps;

    expectTypeOf(props.cardComponent).toEqualTypeOf<typeof Card>();
  });

  it("exposes controlled and uncontrolled provider props", () => {
    expectTypeOf<OnbordaState>().toEqualTypeOf<{
      currentTour: string | null;
      currentStep: number;
      isOnbordaVisible: boolean;
    }>();

    expectTypeOf<OnbordaProviderProps>().toMatchTypeOf<{
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
    }>();

    expectTypeOf<OnbordaProgressStorage>().toMatchTypeOf<{
      getItem: (key: string) => string | null;
      setItem: (key: string, value: string) => void;
      removeItem: (key: string) => void;
    }>();

    expectTypeOf<OnbordaPersistedProgress>().toMatchTypeOf<
      OnbordaState & {
        version: 1;
        updatedAt: number;
      }
    >();

    expectTypeOf<RouteTransitionDirection>().toEqualTypeOf<"next" | "prev">();

    expectTypeOf<RouteTransitionComplete>().toMatchTypeOf<
      RouteTransition & {
        targetFound: boolean;
      }
    >();

    expectTypeOf<OnbordaAccessibilityOptions>().toMatchTypeOf<{
      dialogRole?: "dialog" | "alertdialog";
      ariaLabel?: string | null | ((context: OnbordaAccessibilityContext) => string | null | undefined);
      ariaLabelledBy?: string | null | ((context: OnbordaAccessibilityContext) => string | null | undefined);
      ariaDescribedBy?: string | null | ((context: OnbordaAccessibilityContext) => string | null | undefined);
      ariaModal?: boolean;
      useCardLabelIds?: boolean;
      progressText?: string | null | ((context: OnbordaAccessibilityContext) => string | null | undefined);
      liveRegion?: "off" | "polite" | "assertive";
    }>();
  });
});
