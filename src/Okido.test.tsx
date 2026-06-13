import React, { useEffect } from "react";
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Okido from "./Okido";
import { OkidoProvider, useOkido } from "./OkidoContext";
import type {
  CardComponentProps,
  OkidoProgressStorage,
  OkidoState,
  RouteTransition,
  RouteTransitionComplete,
  Tour,
} from "./types";

const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

afterEach(() => {
  cleanup();
  pushMock.mockClear();
  vi.useRealTimers();
  Object.defineProperty(window, "innerWidth", {
    configurable: true,
    writable: true,
    value: 1024,
  });
});

function setViewportWidth(width: number) {
  Object.defineProperty(window, "innerWidth", {
    configurable: true,
    writable: true,
    value: width,
  });
  fireEvent(window, new Event("resize"));
}

function createMemoryStorage(initialValues: Record<string, string> = {}): OkidoProgressStorage {
  const values = new Map(Object.entries(initialValues));

  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => {
      values.set(key, value);
    },
    removeItem: (key) => {
      values.delete(key);
    },
  };
}

const tours: Tour[] = [
  {
    tour: "main",
    steps: [
      {
        title: "First step",
        content: "First content",
        selector: "#first-target",
        side: "bottom",
      },
      {
        title: "Missing step",
        content: "Missing content",
        selector: "#missing-target",
        side: "right",
      },
    ],
  },
];

const mobilePlacementTours: Tour[] = [
  {
    tour: "main",
    steps: [
      {
        title: "Mobile placement step",
        content: "Mobile placement content",
        selector: "#first-target",
        side: "bottom",
        mobileSide: "top",
      },
    ],
  },
];

const policyTours: Tour[] = [
  {
    tour: "main",
    steps: [
      {
        title: "First step",
        content: "First content",
        selector: "#first-target",
        side: "bottom",
      },
      {
        title: "Missing step",
        content: "Missing content",
        selector: "#missing-target",
        side: "right",
      },
      {
        title: "Third step",
        content: "Third content",
        selector: "#third-target",
        side: "bottom",
      },
    ],
  },
];

const routeTours: Tour[] = [
  {
    tour: "main",
    steps: [
      {
        title: "First step",
        content: "First content",
        selector: "#first-target",
        side: "bottom",
        nextRoute: "/second",
      },
      {
        title: "Second step",
        content: "Second content",
        selector: "#second-target",
        side: "bottom",
        prevRoute: "/first",
      },
    ],
  },
];

const routeMissingTargetTours: Tour[] = [
  {
    tour: "main",
    steps: [
      {
        title: "First step",
        content: "First content",
        selector: "#first-target",
        side: "bottom",
        nextRoute: "/missing-target",
      },
      {
        title: "Missing route step",
        content: "Missing route content",
        selector: "#missing-route-target",
        side: "bottom",
      },
    ],
  },
];

function Starter({ step = 0, tour = "main" }: { step?: number; tour?: string }) {
  const { startOkido, setCurrentStep } = useOkido();

  useEffect(() => {
    startOkido(tour);
    if (step > 0) {
      setCurrentStep(step);
    }
  }, [setCurrentStep, startOkido, step, tour]);

  return null;
}

function StartButton() {
  const { startOkido } = useOkido();

  return (
    <button type="button" onClick={() => startOkido("main")}>
      Start tour
    </button>
  );
}

function ProgressControls() {
  const { startOkido, clearPersistedProgress } = useOkido();

  return (
    <>
      <button type="button" onClick={() => startOkido("main")}>
        Start tour
      </button>
      <button type="button" onClick={clearPersistedProgress}>
        Clear progress
      </button>
    </>
  );
}

function RegistryStarter({ tour = "registered" }: { tour?: string }) {
  const { registerTour, startOkido } = useOkido();

  useEffect(() => {
    const unregister = registerTour({
      tour,
      steps: [
        {
          title: "Registered step",
          content: "Registered content",
          selector: "#registered-target",
        },
      ],
    });

    startOkido(tour);

    return unregister;
  }, [registerTour, startOkido, tour]);

  return null;
}

function RegistryControls() {
  const { registerTour, unregisterTour, startOkido } = useOkido();

  return (
    <>
      <button
        type="button"
        onClick={() => {
          registerTour({
            tour: "manual-registry",
            steps: [
              {
                title: "Manual registered step",
                content: "Manual registered content",
                selector: "#registered-target",
              },
            ],
          });
        }}
      >
        Register tour
      </button>
      <button type="button" onClick={() => startOkido("manual-registry")}>
        Start registered
      </button>
      <button type="button" onClick={() => unregisterTour("manual-registry")}>
        Unregister tour
      </button>
    </>
  );
}

function TestCard({
  step,
  currentStep,
  totalSteps,
  nextStep,
  prevStep,
  skipTour,
  closeOkido,
  isFirstStep,
  isLastStep,
  targetFound,
  arrow,
  a11y,
}: CardComponentProps) {
  return (
    <section>
      <h2>{step.title}</h2>
      <p>{`${currentStep + 1}/${totalSteps}`}</p>
      <p>{targetFound ? "target-found" : "target-missing"}</p>
      <p>{isFirstStep ? "first-step" : "not-first-step"}</p>
      <p>{isLastStep ? "last-step" : "not-last-step"}</p>
      <p>{arrow ? "arrow-present" : "arrow-missing"}</p>
      <p>{a11y.progressText}</p>
      <input aria-label="Card input" />
      <button type="button" onClick={prevStep}>
        Previous
      </button>
      <button type="button" onClick={nextStep}>
        Next
      </button>
      <button type="button" onClick={skipTour}>
        Skip
      </button>
      <button type="button" onClick={closeOkido}>
        Close
      </button>
    </section>
  );
}

function A11yCard({ step, a11y }: CardComponentProps) {
  return (
    <section>
      <h2 {...a11y.titleProps}>{step.title}</h2>
      <p {...a11y.descriptionProps}>Custom accessible description</p>
    </section>
  );
}

function HeadlessCard({ step, headless }: CardComponentProps) {
  return (
    <section>
      <h2>{step.title}</h2>
      <p>{headless.progressText}</p>
      <p>{headless.targetFound ? "headless-target-found" : "headless-target-missing"}</p>
      <button {...headless.getPrevButtonProps()}>Headless previous</button>
      <button {...headless.getNextButtonProps()}>Headless next</button>
      <button {...headless.getSkipButtonProps()}>Headless skip</button>
      <button {...headless.getCloseButtonProps()}>Headless close</button>
    </section>
  );
}

function renderOkido({
  step = 0,
  interact = true,
  onTourSkip = vi.fn(),
  targetMissingPolicy,
  onTargetMissing = vi.fn(),
}: {
  step?: number;
  interact?: boolean;
  onTourSkip?: (tour: string, currentStep: number) => void;
  targetMissingPolicy?: "fallback" | "skip-step" | "skip-tour";
  onTargetMissing?: (tour: string, stepIndex: number, step: Tour["steps"][number]) => void;
} = {}) {
  return {
    onTourSkip,
    onTargetMissing,
    ...render(
      <OkidoProvider>
        <button type="button">Before tour</button>
        <div id="first-target" style={{ position: "absolute", zIndex: "5" }}>
          Target
        </div>
        <Okido
          steps={tours}
          interact={interact}
          cardComponent={TestCard}
          onTourSkip={onTourSkip}
          targetMissingPolicy={targetMissingPolicy}
          onTargetMissing={onTargetMissing}
        >
          <Starter step={step} />
        </Okido>
      </OkidoProvider>
    ),
  };
}

function renderManualOkido({
  interact = false,
  onTourSkip = vi.fn(),
}: {
  interact?: boolean;
  onTourSkip?: (tour: string, currentStep: number) => void;
} = {}) {
  return {
    onTourSkip,
    ...render(
      <OkidoProvider>
        <div id="first-target" style={{ position: "absolute", zIndex: "5" }}>
          Target
        </div>
        <Okido
          steps={tours}
          interact={interact}
          cardComponent={TestCard}
          onTourSkip={onTourSkip}
        >
          <StartButton />
        </Okido>
      </OkidoProvider>
    ),
  };
}

function ControlledOkido({
  initialState,
  onCurrentTourChange,
  onCurrentStepChange,
  onOpenChange,
  onStateChange,
}: {
  initialState: OkidoState;
  onCurrentTourChange?: (tour: string | null) => void;
  onCurrentStepChange?: (step: number) => void;
  onOpenChange?: (open: boolean) => void;
  onStateChange?: (state: OkidoState) => void;
}) {
  const [state, setState] = React.useState(initialState);

  return (
    <OkidoProvider
      currentTour={state.currentTour}
      currentStep={state.currentStep}
      isOkidoVisible={state.isOkidoVisible}
      onCurrentTourChange={(tour) => {
        onCurrentTourChange?.(tour);
        setState((current) => ({ ...current, currentTour: tour }));
      }}
      onCurrentStepChange={(step) => {
        onCurrentStepChange?.(step);
        setState((current) => ({ ...current, currentStep: step }));
      }}
      onOpenChange={(open) => {
        onOpenChange?.(open);
        setState((current) => ({ ...current, isOkidoVisible: open }));
      }}
      onStateChange={onStateChange}
    >
      <div id="first-target" style={{ position: "absolute", zIndex: "5" }}>
        Target
      </div>
      <Okido steps={tours} interact cardComponent={TestCard}>
        <div />
      </Okido>
    </OkidoProvider>
  );
}

function renderPolicyOkido({
  onTourComplete = vi.fn(),
  onTargetMissing = vi.fn(),
}: {
  onTourComplete?: (tour: string) => void;
  onTargetMissing?: (tour: string, stepIndex: number, step: Tour["steps"][number]) => void;
} = {}) {
  return {
    onTourComplete,
    onTargetMissing,
    ...render(
      <OkidoProvider>
        <div id="first-target" style={{ position: "absolute", zIndex: "5" }}>
          Target
        </div>
        <div id="third-target" style={{ position: "absolute", zIndex: "5" }}>
          Third target
        </div>
        <Okido
          steps={policyTours}
          interact
          cardComponent={TestCard}
          targetMissingPolicy="skip-step"
          onTourComplete={onTourComplete}
          onTargetMissing={onTargetMissing}
        >
          <Starter />
        </Okido>
      </OkidoProvider>
    ),
  };
}

function renderRouteOkido({
  routeSteps = routeTours,
  includeSecondTarget = true,
  onRouteTransitionStart = vi.fn(),
  onRouteTransitionComplete = vi.fn(),
  onRouteTransitionTimeout = vi.fn(),
  onRouteTransitionError = vi.fn(),
}: {
  routeSteps?: Tour[];
  includeSecondTarget?: boolean;
  onRouteTransitionStart?: (transition: RouteTransition) => void;
  onRouteTransitionComplete?: (transition: RouteTransitionComplete) => void;
  onRouteTransitionTimeout?: (transition: RouteTransition) => void;
  onRouteTransitionError?: (transition: RouteTransition, error: unknown) => void;
} = {}) {
  return {
    onRouteTransitionStart,
    onRouteTransitionComplete,
    onRouteTransitionTimeout,
    onRouteTransitionError,
    ...render(
      <OkidoProvider>
        <div id="first-target" style={{ position: "absolute", zIndex: "5" }}>
          Target
        </div>
        {includeSecondTarget && (
          <div id="second-target" style={{ position: "absolute", zIndex: "5" }}>
            Second target
          </div>
        )}
        <Okido
          steps={routeSteps}
          interact
          cardComponent={TestCard}
          onRouteTransitionStart={onRouteTransitionStart}
          onRouteTransitionComplete={onRouteTransitionComplete}
          onRouteTransitionTimeout={onRouteTransitionTimeout}
          onRouteTransitionError={onRouteTransitionError}
        >
          <Starter />
        </Okido>
      </OkidoProvider>
    ),
  };
}

describe("Okido", () => {
  it("passes the expanded card props when the target exists", async () => {
    renderOkido();

    expect(await screen.findByRole("dialog", { name: "First step" })).toBeInTheDocument();
    expect(screen.getByText("Step 1 of 2")).toBeInTheDocument();
    expect(screen.getByText("target-found")).toBeInTheDocument();
    expect(screen.getByText("first-step")).toBeInTheDocument();
    expect(screen.getByText("not-last-step")).toBeInTheDocument();
    expect(screen.getByText("arrow-present")).toBeInTheDocument();
  });

  it("restores target inline styles after closing the tour", async () => {
    renderOkido();
    const target = await screen.findByText("Target");

    expect(target).toHaveStyle({ position: "absolute", zIndex: "990" });

    await userEvent.click(screen.getByRole("button", { name: "Close" }));

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
    expect(target).toHaveStyle({ position: "absolute", zIndex: "5" });
  });

  it("renders a fallback card when the target is missing", async () => {
    const { onTargetMissing } = renderOkido({ step: 1 });

    expect(await screen.findByRole("dialog", { name: "Missing step" })).toBeInTheDocument();
    expect(screen.getByText("target-missing")).toBeInTheDocument();
    expect(screen.getByText("last-step")).toBeInTheDocument();
    expect(screen.getByText("arrow-missing")).toBeInTheDocument();
    expect(onTargetMissing).toHaveBeenCalledWith("main", 1, tours[0].steps[1]);
  });

  it("skips a missing target step when targetMissingPolicy is skip-step", async () => {
    const { onTargetMissing } = renderPolicyOkido();

    expect(await screen.findByRole("dialog", { name: "First step" })).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Next" }));

    expect(await screen.findByRole("dialog", { name: "Third step" })).toBeInTheDocument();
    expect(screen.getByText("target-found")).toBeInTheDocument();
    expect(onTargetMissing).toHaveBeenCalledWith("main", 1, policyTours[0].steps[1]);
  });

  it("skips the tour when targetMissingPolicy is skip-tour", async () => {
    const { onTourSkip, onTargetMissing } = renderOkido({
      step: 1,
      targetMissingPolicy: "skip-tour",
    });

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
    expect(onTargetMissing).toHaveBeenCalledWith("main", 1, tours[0].steps[1]);
    expect(onTourSkip).toHaveBeenCalledWith("main", 1);
  });

  it("fires route transition hooks when a routed target is found", async () => {
    const {
      onRouteTransitionStart,
      onRouteTransitionComplete,
      onRouteTransitionTimeout,
      onRouteTransitionError,
    } = renderRouteOkido();

    expect(await screen.findByRole("dialog", { name: "First step" })).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Next" }));

    expect(pushMock).toHaveBeenCalledWith("/second");
    expect(onRouteTransitionStart).toHaveBeenCalledWith(
      expect.objectContaining({
        tour: "main",
        fromStepIndex: 0,
        toStepIndex: 1,
        route: "/second",
        direction: "next",
      })
    );
    expect(onRouteTransitionComplete).toHaveBeenCalledWith(
      expect.objectContaining({
        tour: "main",
        fromStepIndex: 0,
        toStepIndex: 1,
        route: "/second",
        direction: "next",
        targetFound: true,
      })
    );
    expect(onRouteTransitionTimeout).not.toHaveBeenCalled();
    expect(onRouteTransitionError).not.toHaveBeenCalled();
    expect(await screen.findByRole("dialog", { name: "Second step" })).toBeInTheDocument();
  });

  it("fires timeout and completion hooks when a routed target is missing", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const {
      onRouteTransitionStart,
      onRouteTransitionComplete,
      onRouteTransitionTimeout,
    } = renderRouteOkido({
      routeSteps: routeMissingTargetTours,
      includeSecondTarget: false,
    });

    expect(await screen.findByRole("dialog", { name: "First step" })).toBeInTheDocument();

    vi.useFakeTimers();
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
      await vi.advanceTimersByTimeAsync(5000);
    });

    expect(onRouteTransitionStart).toHaveBeenCalledWith(
      expect.objectContaining({
        route: "/missing-target",
        direction: "next",
      })
    );
    expect(onRouteTransitionTimeout).toHaveBeenCalledWith(
      expect.objectContaining({
        route: "/missing-target",
        toStepIndex: 1,
      })
    );
    expect(onRouteTransitionComplete).toHaveBeenCalledWith(
      expect.objectContaining({
        route: "/missing-target",
        toStepIndex: 1,
        targetFound: false,
      })
    );
    expect(screen.getByRole("dialog", { name: "Missing route step" })).toBeInTheDocument();
    warnSpy.mockRestore();
  });

  it("fires route transition error hook when route navigation throws", async () => {
    const error = new Error("route failed");
    pushMock.mockImplementationOnce(() => {
      throw error;
    });
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { onRouteTransitionError, onRouteTransitionComplete } = renderRouteOkido();

    expect(await screen.findByRole("dialog", { name: "First step" })).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Next" }));

    expect(onRouteTransitionError).toHaveBeenCalledWith(
      expect.objectContaining({
        route: "/second",
        direction: "next",
      }),
      error
    );
    expect(onRouteTransitionComplete).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog", { name: "First step" })).toBeInTheDocument();
    errorSpy.mockRestore();
  });

  it("supports custom dialog labeling through card accessibility ids", async () => {
    render(
      <OkidoProvider>
        <div id="first-target" style={{ position: "absolute", zIndex: "5" }}>
          Target
        </div>
        <Okido
          steps={tours}
          interact
          cardComponent={A11yCard}
          accessibility={{
            dialogRole: "alertdialog",
            ariaModal: true,
            useCardLabelIds: true,
            liveRegion: "polite",
            progressText: ({ currentStep, totalSteps }) =>
              `Progress ${currentStep + 1}/${totalSteps}`,
          }}
        >
          <Starter />
        </Okido>
      </OkidoProvider>
    );

    const dialog = await screen.findByRole("alertdialog", { name: "First step" });

    expect(dialog).toHaveAccessibleDescription("Custom accessible description");
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(screen.getByText("Progress 1/2")).toBeInTheDocument();
  });

  it("supports custom aria-label and describedby resolvers", async () => {
    render(
      <OkidoProvider>
        <p id="external-description">External dialog description</p>
        <div id="first-target" style={{ position: "absolute", zIndex: "5" }}>
          Target
        </div>
        <Okido
          steps={tours}
          interact
          cardComponent={TestCard}
          accessibility={{
            ariaLabel: ({ step }) => `Tour step: ${step.title}`,
            ariaDescribedBy: "external-description",
          }}
        >
          <Starter />
        </Okido>
      </OkidoProvider>
    );

    const dialog = await screen.findByRole("dialog", {
      name: "Tour step: First step",
    });

    expect(dialog).toHaveAccessibleDescription("External dialog description");
  });

  it("does not navigate steps with arrow keys while typing in an input", async () => {
    renderOkido();
    const input = await screen.findByRole("textbox", { name: "Card input" });

    await userEvent.click(input);
    await userEvent.keyboard("{ArrowRight}");

    expect(screen.getByRole("dialog", { name: "First step" })).toBeInTheDocument();
  });

  it("skips the tour with Escape and restores focus", async () => {
    const { onTourSkip } = renderManualOkido({ interact: false });
    const startButton = screen.getByRole("button", { name: "Start tour" });

    await userEvent.click(startButton);

    expect(await screen.findByRole("dialog", { name: "First step" })).toBeInTheDocument();

    await userEvent.keyboard("{Escape}");

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
    expect(onTourSkip).toHaveBeenCalledWith("main", 0);
    expect(startButton).toHaveFocus();
  });

  it("supports uncontrolled default provider state", async () => {
    render(
      <OkidoProvider
        defaultCurrentTour="main"
        defaultCurrentStep={1}
        defaultIsOkidoVisible
      >
        <div id="first-target" style={{ position: "absolute", zIndex: "5" }}>
          Target
        </div>
        <Okido steps={tours} interact cardComponent={TestCard}>
          <div />
        </Okido>
      </OkidoProvider>
    );

    expect(await screen.findByRole("dialog", { name: "Missing step" })).toBeInTheDocument();
    expect(screen.getByText("target-missing")).toBeInTheDocument();
  });

  it("supports externally controlled step changes", async () => {
    const onCurrentStepChange = vi.fn();
    const onStateChange = vi.fn();

    render(
      <ControlledOkido
        initialState={{
          currentTour: "main",
          currentStep: 0,
          isOkidoVisible: true,
        }}
        onCurrentStepChange={onCurrentStepChange}
        onStateChange={onStateChange}
      />
    );

    expect(await screen.findByRole("dialog", { name: "First step" })).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Next" }));

    expect(onCurrentStepChange).toHaveBeenCalledWith(1);
    expect(onStateChange).toHaveBeenCalledWith({
      currentTour: "main",
      currentStep: 1,
      isOkidoVisible: true,
    });
    expect(await screen.findByRole("dialog", { name: "Missing step" })).toBeInTheDocument();
  });

  it("supports externally controlled open state when closing", async () => {
    const onCurrentTourChange = vi.fn();
    const onOpenChange = vi.fn();
    const onStateChange = vi.fn();

    render(
      <ControlledOkido
        initialState={{
          currentTour: "main",
          currentStep: 0,
          isOkidoVisible: true,
        }}
        onCurrentTourChange={onCurrentTourChange}
        onOpenChange={onOpenChange}
        onStateChange={onStateChange}
      />
    );

    expect(await screen.findByRole("dialog", { name: "First step" })).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Close" }));

    expect(onCurrentTourChange).toHaveBeenCalledWith(null);
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(onStateChange).toHaveBeenCalledWith({
      currentTour: null,
      currentStep: 0,
      isOkidoVisible: false,
    });
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  it("restores uncontrolled progress from persisted storage", async () => {
    const storageKey = "okido:test-progress";
    const storage = createMemoryStorage({
      [storageKey]: JSON.stringify({
        version: 1,
        currentTour: "main",
        currentStep: 1,
        isOkidoVisible: true,
        updatedAt: Date.now(),
      }),
    });

    render(
      <OkidoProvider
        progressPersistence={{
          storage,
          storageKey,
        }}
      >
        <div id="first-target" style={{ position: "absolute", zIndex: "5" }}>
          Target
        </div>
        <Okido steps={tours} interact cardComponent={TestCard}>
          <div />
        </Okido>
      </OkidoProvider>
    );

    expect(await screen.findByRole("dialog", { name: "Missing step" })).toBeInTheDocument();
  });

  it("persists progress when the tour state changes", async () => {
    const storageKey = "okido:test-progress";
    const storage = createMemoryStorage();

    render(
      <OkidoProvider
        progressPersistence={{
          storage,
          storageKey,
        }}
      >
        <div id="first-target" style={{ position: "absolute", zIndex: "5" }}>
          Target
        </div>
        <Okido steps={tours} interact cardComponent={TestCard}>
          <StartButton />
        </Okido>
      </OkidoProvider>
    );

    await userEvent.click(screen.getByRole("button", { name: "Start tour" }));
    expect(await screen.findByRole("dialog", { name: "First step" })).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Next" }));

    await waitFor(() => {
      expect(JSON.parse(storage.getItem(storageKey) ?? "{}")).toMatchObject({
        version: 1,
        currentTour: "main",
        currentStep: 1,
        isOkidoVisible: true,
      });
    });
  });

  it("can clear persisted progress from the context", async () => {
    const storageKey = "okido:test-progress";
    const storage = createMemoryStorage();

    render(
      <OkidoProvider
        progressPersistence={{
          storage,
          storageKey,
        }}
      >
        <div id="first-target" style={{ position: "absolute", zIndex: "5" }}>
          Target
        </div>
        <Okido steps={tours} interact cardComponent={TestCard}>
          <ProgressControls />
        </Okido>
      </OkidoProvider>
    );

    await userEvent.click(screen.getByRole("button", { name: "Start tour" }));
    await waitFor(() => {
      expect(storage.getItem(storageKey)).not.toBeNull();
    });

    await userEvent.click(screen.getByRole("button", { name: "Clear progress" }));

    expect(storage.getItem(storageKey)).toBeNull();
  });

  it("supports tours registered through context", async () => {
    render(
      <OkidoProvider>
        <div id="registered-target" style={{ position: "absolute", zIndex: "5" }}>
          Registered target
        </div>
        <Okido interact cardComponent={TestCard}>
          <RegistryStarter />
        </Okido>
      </OkidoProvider>
    );

    expect(await screen.findByRole("dialog", { name: "Registered step" })).toBeInTheDocument();
  });

  it("supports manual tour registry updates", async () => {
    render(
      <OkidoProvider>
        <div id="registered-target" style={{ position: "absolute", zIndex: "5" }}>
          Registered target
        </div>
        <Okido interact cardComponent={TestCard}>
          <RegistryControls />
        </Okido>
      </OkidoProvider>
    );

    await userEvent.click(screen.getByRole("button", { name: "Register tour" }));
    await userEvent.click(screen.getByRole("button", { name: "Start registered" }));

    expect(await screen.findByRole("dialog", { name: "Manual registered step" })).toBeInTheDocument();
  });

  it("filters conditional steps before rendering and navigation", async () => {
    const conditionalTours: Tour[] = [
      {
        tour: "main",
        steps: [
          {
            title: "Visible conditional step",
            content: "Visible content",
            selector: "#first-target",
            when: () => true,
          },
          {
            title: "Hidden conditional step",
            content: "Hidden content",
            selector: "#hidden-target",
            when: false,
          },
          {
            title: "Final conditional step",
            content: "Final content",
            selector: "#third-target",
          },
        ],
      },
    ];

    render(
      <OkidoProvider>
        <div id="first-target" style={{ position: "absolute", zIndex: "5" }}>
          Target
        </div>
        <div id="third-target" style={{ position: "absolute", zIndex: "5" }}>
          Third target
        </div>
        <Okido steps={conditionalTours} interact cardComponent={TestCard}>
          <Starter />
        </Okido>
      </OkidoProvider>
    );

    expect(await screen.findByRole("dialog", { name: "Visible conditional step" })).toBeInTheDocument();
    expect(screen.getByText("1/2")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Next" }));

    expect(await screen.findByRole("dialog", { name: "Final conditional step" })).toBeInTheDocument();
    expect(screen.queryByText("Hidden conditional step")).not.toBeInTheDocument();
  });

  it("loads async steps before rendering a started tour", async () => {
    const onStepsLoadStart = vi.fn();
    const onStepsLoadSuccess = vi.fn();

    render(
      <OkidoProvider>
        <div id="async-target" style={{ position: "absolute", zIndex: "5" }}>
          Async target
        </div>
        <Okido
          steps={async () => [
            {
              tour: "main",
              steps: [
                {
                  title: "Async step",
                  content: "Async content",
                  selector: "#async-target",
                },
              ],
            },
          ]}
          interact
          cardComponent={TestCard}
          onStepsLoadStart={onStepsLoadStart}
          onStepsLoadSuccess={onStepsLoadSuccess}
        >
          <Starter />
        </Okido>
      </OkidoProvider>
    );

    expect(await screen.findByRole("dialog", { name: "Async step" })).toBeInTheDocument();
    expect(onStepsLoadStart).toHaveBeenCalledTimes(1);
    expect(onStepsLoadSuccess).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          tour: "main",
        }),
      ])
    );
  });

  it("reports async step loader errors", async () => {
    const error = new Error("load failed");
    const onStepsLoadError = vi.fn();

    render(
      <OkidoProvider>
        <Okido
          steps={async () => {
            throw error;
          }}
          interact
          cardComponent={TestCard}
          onStepsLoadError={onStepsLoadError}
        >
          <Starter />
        </Okido>
      </OkidoProvider>
    );

    await waitFor(() => {
      expect(onStepsLoadError).toHaveBeenCalledWith(error);
    });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("fires analytics events for tour start, step changes, and completion", async () => {
    const onAnalyticsEvent = vi.fn();

    render(
      <OkidoProvider>
        <div id="first-target" style={{ position: "absolute", zIndex: "5" }}>
          Target
        </div>
        <Okido
          steps={tours}
          interact
          cardComponent={TestCard}
          onAnalyticsEvent={onAnalyticsEvent}
        >
          <Starter />
        </Okido>
      </OkidoProvider>
    );

    expect(await screen.findByRole("dialog", { name: "First step" })).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Next" }));
    await userEvent.click(screen.getByRole("button", { name: "Next" }));

    expect(onAnalyticsEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "tour_start",
        tour: "main",
      })
    );
    expect(onAnalyticsEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "step_next",
        tour: "main",
        stepIndex: 0,
      })
    );
    expect(onAnalyticsEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "step_change",
        tour: "main",
        stepIndex: 1,
      })
    );
    expect(onAnalyticsEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "tour_complete",
        tour: "main",
      })
    );
  });

  it("passes headless helpers that wire card controls", async () => {
    render(
      <OkidoProvider>
        <div id="first-target" style={{ position: "absolute", zIndex: "5" }}>
          Target
        </div>
        <Okido steps={tours} interact cardComponent={HeadlessCard}>
          <Starter />
        </Okido>
      </OkidoProvider>
    );

    expect(await screen.findByRole("dialog", { name: "First step" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Previous step" })).toBeDisabled();
    expect(screen.getByText("Step 1 of 2")).toBeInTheDocument();
    expect(screen.getByText("headless-target-found")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Next step" }));

    expect(await screen.findByRole("dialog", { name: "Missing step" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Previous step" })).not.toBeDisabled();
    expect(screen.getByText("Step 2 of 2")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Close tour" }));

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  it("warns in dev mode for invalid selectors without throwing", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const invalidTours: Tour[] = [
      {
        tour: "invalid",
        steps: [
          {
            title: "Invalid selector",
            content: "Invalid content",
            selector: "[",
          },
        ],
      },
    ];

    render(
      <OkidoProvider>
        <Okido steps={invalidTours} interact cardComponent={TestCard} devWarnings>
          <Starter tour="invalid" />
        </Okido>
      </OkidoProvider>
    );

    expect(await screen.findByRole("dialog", { name: "Invalid selector" })).toBeInTheDocument();
    expect(screen.getByText("target-missing")).toBeInTheDocument();
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("Okido: Invalid selector"),
      expect.objectContaining({
        selector: "[",
      })
    );

    warnSpy.mockRestore();
  });

  it("emits debug events and marks the wrapper when debug mode is enabled", async () => {
    const debugSpy = vi.spyOn(console, "debug").mockImplementation(() => {});
    const onDebug = vi.fn();

    const { container } = render(
      <OkidoProvider>
        <div id="first-target" style={{ position: "absolute", zIndex: "5" }}>
          Target
        </div>
        <Okido
          steps={tours}
          interact
          cardComponent={TestCard}
          debug={{ onEvent: onDebug }}
        >
          <Starter />
        </Okido>
      </OkidoProvider>
    );

    expect(await screen.findByRole("dialog", { name: "First step" })).toBeInTheDocument();
    expect(container.querySelector("[data-okido-debug='true']")).toBeInTheDocument();
    expect(onDebug).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "analytics",
        message: "Analytics event: tour_start",
      })
    );
    expect(debugSpy).toHaveBeenCalledWith(
      "[Okido] Analytics event: tour_start",
      expect.objectContaining({
        type: "tour_start",
      })
    );

    debugSpy.mockRestore();
  });

  it("uses a step mobileSide placement on mobile viewports", async () => {
    setViewportWidth(480);

    render(
      <OkidoProvider>
        <div id="first-target" style={{ position: "absolute", zIndex: "5" }}>
          Target
        </div>
        <Okido steps={mobilePlacementTours} interact cardComponent={TestCard}>
          <Starter />
        </Okido>
      </OkidoProvider>
    );

    expect(await screen.findByRole("dialog", { name: "Mobile placement step" })).toBeInTheDocument();
    expect(screen.getByText("arrow-present")).toBeInTheDocument();
    expect(screen.getByRole("dialog")).toHaveAttribute("data-okido-placement", "top");
    expect(screen.getByRole("dialog")).toHaveAttribute("data-okido-mobile-placement", "top");
  });

  it("supports the center mobile placement preset while keeping target state", async () => {
    setViewportWidth(480);

    render(
      <OkidoProvider>
        <div id="first-target" style={{ position: "absolute", zIndex: "5" }}>
          Target
        </div>
        <Okido
          steps={tours}
          interact
          cardComponent={TestCard}
          mobilePlacement="center"
        >
          <Starter />
        </Okido>
      </OkidoProvider>
    );

    expect(await screen.findByRole("dialog", { name: "First step" })).toBeInTheDocument();
    expect(screen.getByText("target-found")).toBeInTheDocument();
    expect(screen.getByText("arrow-missing")).toBeInTheDocument();
    expect(screen.getByRole("dialog")).toHaveAttribute("data-okido-placement", "center");
    expect(screen.getByRole("dialog")).toHaveAttribute("data-okido-mobile-placement", "center");
    expect(document.querySelector("[data-name='okido-card-wrapper']")).toHaveStyle({
      position: "fixed",
      top: "50%",
      left: "50%",
    });
  });
});
