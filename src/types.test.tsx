import React from "react";
import { describe, expectTypeOf, it } from "vitest";
import type {
  CardComponentProps,
  OkidoAccessibilityContext,
  OkidoAccessibilityOptions,
  OkidoAnalyticsEvent,
  OkidoCardAccessibilityProps,
  OkidoDebugEvent,
  OkidoDebugOptions,
  OkidoHeadlessHelpers,
  OkidoMobilePlacement,
  OkidoMobilePlacementOptions,
  OkidoMobilePlacementPreset,
  OkidoPlacementSide,
  OkidoPersistedProgress,
  OkidoProgressPersistence,
  OkidoProgressStorage,
  OkidoProps,
  OkidoProviderProps,
  OkidoState,
  RouteTransition,
  RouteTransitionComplete,
  RouteTransitionDirection,
  TargetMissingPolicy,
  Tour,
  TourResolver,
} from "./types";

function Card(_: CardComponentProps) {
  return null;
}

describe("public types", () => {
  it("requires a card component and exposes expanded card props", () => {
    expectTypeOf<CardComponentProps>().toMatchTypeOf<{
      skipTour: () => void;
      closeOkido: () => void;
      isFirstStep: boolean;
      isLastStep: boolean;
      targetFound: boolean;
      arrow?: React.ReactElement | null;
      a11y: OkidoCardAccessibilityProps;
      headless: OkidoHeadlessHelpers;
    }>();

    expectTypeOf<OkidoProps>().toMatchTypeOf<{
      steps?: Tour[] | TourResolver;
      cardComponent: React.ComponentType<CardComponentProps>;
      targetMissingPolicy?: TargetMissingPolicy;
      accessibility?: OkidoAccessibilityOptions;
      mobilePlacement?: OkidoMobilePlacement;
      devWarnings?: boolean;
      debug?: boolean | OkidoDebugOptions;
      onTargetMissing?: OkidoProps["onTargetMissing"];
      onStepsLoadStart?: () => void;
      onStepsLoadSuccess?: (tours: Tour[]) => void;
      onStepsLoadError?: (error: unknown) => void;
      onAnalyticsEvent?: (event: OkidoAnalyticsEvent) => void;
      onRouteTransitionStart?: (transition: RouteTransition) => void;
      onRouteTransitionComplete?: (transition: RouteTransitionComplete) => void;
      onRouteTransitionTimeout?: (transition: RouteTransition) => void;
      onRouteTransitionError?: (transition: RouteTransition, error: unknown) => void;
    }>();

    const props = {
      children: null,
      steps: [],
      cardComponent: Card,
      mobilePlacement: {
        breakpoint: 640,
        placement: "bottom",
        fallbackPlacements: ["bottom", "top"],
      },
    } satisfies OkidoProps;

    expectTypeOf(props.cardComponent).toEqualTypeOf<typeof Card>();
  });

  it("exposes controlled and uncontrolled provider props", () => {
    expectTypeOf<OkidoState>().toEqualTypeOf<{
      currentTour: string | null;
      currentStep: number;
      isOkidoVisible: boolean;
    }>();

    expectTypeOf<OkidoProviderProps>().toMatchTypeOf<{
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
      initialTours?: Tour[];
    }>();

    expectTypeOf<OkidoProgressStorage>().toMatchTypeOf<{
      getItem: (key: string) => string | null;
      setItem: (key: string, value: string) => void;
      removeItem: (key: string) => void;
    }>();

    expectTypeOf<OkidoPersistedProgress>().toMatchTypeOf<
      OkidoState & {
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

    expectTypeOf<OkidoAccessibilityOptions>().toMatchTypeOf<{
      dialogRole?: "dialog" | "alertdialog";
      ariaLabel?: string | null | ((context: OkidoAccessibilityContext) => string | null | undefined);
      ariaLabelledBy?: string | null | ((context: OkidoAccessibilityContext) => string | null | undefined);
      ariaDescribedBy?: string | null | ((context: OkidoAccessibilityContext) => string | null | undefined);
      ariaModal?: boolean;
      useCardLabelIds?: boolean;
      progressText?: string | null | ((context: OkidoAccessibilityContext) => string | null | undefined);
      liveRegion?: "off" | "polite" | "assertive";
    }>();

    expectTypeOf<OkidoDebugOptions>().toMatchTypeOf<{
      enabled?: boolean;
      log?: boolean;
      onEvent?: (event: OkidoDebugEvent) => void;
    }>();

    expectTypeOf<OkidoHeadlessHelpers>().toMatchTypeOf<{
      progressText: string;
      canGoNext: boolean;
      canGoPrev: boolean;
      getNextButtonProps: OkidoHeadlessHelpers["getNextButtonProps"];
      getPrevButtonProps: OkidoHeadlessHelpers["getPrevButtonProps"];
      getSkipButtonProps: OkidoHeadlessHelpers["getSkipButtonProps"];
      getCloseButtonProps: OkidoHeadlessHelpers["getCloseButtonProps"];
    }>();

    expectTypeOf<OkidoPlacementSide>().toEqualTypeOf<
      | "top"
      | "bottom"
      | "left"
      | "right"
      | "top-left"
      | "top-right"
      | "bottom-left"
      | "bottom-right"
      | "left-top"
      | "left-bottom"
      | "right-top"
      | "right-bottom"
    >();

    expectTypeOf<OkidoMobilePlacementPreset>().toEqualTypeOf<
      "auto" | "top" | "bottom" | "center"
    >();

    expectTypeOf<OkidoMobilePlacementOptions>().toMatchTypeOf<{
      breakpoint?: number;
      placement?: OkidoPlacementSide | OkidoMobilePlacementPreset;
      fallbackPlacements?: OkidoPlacementSide[];
      offset?: number;
      shiftPadding?: number;
    }>();

    expectTypeOf<Tour["steps"][number]>().toMatchTypeOf<{
      mobileSide?: OkidoPlacementSide | OkidoMobilePlacementPreset;
    }>();

    expectTypeOf<OkidoContextType>().toMatchTypeOf<{
      registeredTours: Tour[];
      registerTour: (tour: Tour) => () => void;
      registerTours: (tours: Tour[]) => () => void;
      unregisterTour: (tourName: string) => void;
    }>();
  });
});
