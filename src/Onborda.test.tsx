import React, { useEffect } from "react";
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Onborda from "./Onborda";
import { OnbordaProvider, useOnborda } from "./OnbordaContext";
import type { CardComponentProps, OnbordaState, Tour } from "./types";

const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

afterEach(() => {
  cleanup();
  pushMock.mockClear();
});

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

function Starter({ step = 0 }: { step?: number }) {
  const { startOnborda, setCurrentStep } = useOnborda();

  useEffect(() => {
    startOnborda("main");
    if (step > 0) {
      setCurrentStep(step);
    }
  }, [setCurrentStep, startOnborda, step]);

  return null;
}

function StartButton() {
  const { startOnborda } = useOnborda();

  return (
    <button type="button" onClick={() => startOnborda("main")}>
      Start tour
    </button>
  );
}

function TestCard({
  step,
  currentStep,
  totalSteps,
  nextStep,
  prevStep,
  skipTour,
  closeOnborda,
  isFirstStep,
  isLastStep,
  targetFound,
  arrow,
}: CardComponentProps) {
  return (
    <section>
      <h2>{step.title}</h2>
      <p>{`${currentStep + 1}/${totalSteps}`}</p>
      <p>{targetFound ? "target-found" : "target-missing"}</p>
      <p>{isFirstStep ? "first-step" : "not-first-step"}</p>
      <p>{isLastStep ? "last-step" : "not-last-step"}</p>
      <p>{arrow ? "arrow-present" : "arrow-missing"}</p>
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
      <button type="button" onClick={closeOnborda}>
        Close
      </button>
    </section>
  );
}

function renderOnborda({
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
      <OnbordaProvider>
        <button type="button">Before tour</button>
        <div id="first-target" style={{ position: "absolute", zIndex: "5" }}>
          Target
        </div>
        <Onborda
          steps={tours}
          interact={interact}
          cardComponent={TestCard}
          onTourSkip={onTourSkip}
          targetMissingPolicy={targetMissingPolicy}
          onTargetMissing={onTargetMissing}
        >
          <Starter step={step} />
        </Onborda>
      </OnbordaProvider>
    ),
  };
}

function renderManualOnborda({
  interact = false,
  onTourSkip = vi.fn(),
}: {
  interact?: boolean;
  onTourSkip?: (tour: string, currentStep: number) => void;
} = {}) {
  return {
    onTourSkip,
    ...render(
      <OnbordaProvider>
        <div id="first-target" style={{ position: "absolute", zIndex: "5" }}>
          Target
        </div>
        <Onborda
          steps={tours}
          interact={interact}
          cardComponent={TestCard}
          onTourSkip={onTourSkip}
        >
          <StartButton />
        </Onborda>
      </OnbordaProvider>
    ),
  };
}

function ControlledOnborda({
  initialState,
  onCurrentTourChange,
  onCurrentStepChange,
  onOpenChange,
  onStateChange,
}: {
  initialState: OnbordaState;
  onCurrentTourChange?: (tour: string | null) => void;
  onCurrentStepChange?: (step: number) => void;
  onOpenChange?: (open: boolean) => void;
  onStateChange?: (state: OnbordaState) => void;
}) {
  const [state, setState] = React.useState(initialState);

  return (
    <OnbordaProvider
      currentTour={state.currentTour}
      currentStep={state.currentStep}
      isOnbordaVisible={state.isOnbordaVisible}
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
        setState((current) => ({ ...current, isOnbordaVisible: open }));
      }}
      onStateChange={onStateChange}
    >
      <div id="first-target" style={{ position: "absolute", zIndex: "5" }}>
        Target
      </div>
      <Onborda steps={tours} interact cardComponent={TestCard}>
        <div />
      </Onborda>
    </OnbordaProvider>
  );
}

function renderPolicyOnborda({
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
      <OnbordaProvider>
        <div id="first-target" style={{ position: "absolute", zIndex: "5" }}>
          Target
        </div>
        <div id="third-target" style={{ position: "absolute", zIndex: "5" }}>
          Third target
        </div>
        <Onborda
          steps={policyTours}
          interact
          cardComponent={TestCard}
          targetMissingPolicy="skip-step"
          onTourComplete={onTourComplete}
          onTargetMissing={onTargetMissing}
        >
          <Starter />
        </Onborda>
      </OnbordaProvider>
    ),
  };
}

describe("Onborda", () => {
  it("passes the expanded card props when the target exists", async () => {
    renderOnborda();

    expect(await screen.findByRole("dialog", { name: "First step" })).toBeInTheDocument();
    expect(screen.getByText("target-found")).toBeInTheDocument();
    expect(screen.getByText("first-step")).toBeInTheDocument();
    expect(screen.getByText("not-last-step")).toBeInTheDocument();
    expect(screen.getByText("arrow-present")).toBeInTheDocument();
  });

  it("restores target inline styles after closing the tour", async () => {
    renderOnborda();
    const target = await screen.findByText("Target");

    expect(target).toHaveStyle({ position: "absolute", zIndex: "990" });

    await userEvent.click(screen.getByRole("button", { name: "Close" }));

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
    expect(target).toHaveStyle({ position: "absolute", zIndex: "5" });
  });

  it("renders a fallback card when the target is missing", async () => {
    const { onTargetMissing } = renderOnborda({ step: 1 });

    expect(await screen.findByRole("dialog", { name: "Missing step" })).toBeInTheDocument();
    expect(screen.getByText("target-missing")).toBeInTheDocument();
    expect(screen.getByText("last-step")).toBeInTheDocument();
    expect(screen.getByText("arrow-missing")).toBeInTheDocument();
    expect(onTargetMissing).toHaveBeenCalledWith("main", 1, tours[0].steps[1]);
  });

  it("skips a missing target step when targetMissingPolicy is skip-step", async () => {
    const { onTargetMissing } = renderPolicyOnborda();

    expect(await screen.findByRole("dialog", { name: "First step" })).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Next" }));

    expect(await screen.findByRole("dialog", { name: "Third step" })).toBeInTheDocument();
    expect(screen.getByText("target-found")).toBeInTheDocument();
    expect(onTargetMissing).toHaveBeenCalledWith("main", 1, policyTours[0].steps[1]);
  });

  it("skips the tour when targetMissingPolicy is skip-tour", async () => {
    const { onTourSkip, onTargetMissing } = renderOnborda({
      step: 1,
      targetMissingPolicy: "skip-tour",
    });

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
    expect(onTargetMissing).toHaveBeenCalledWith("main", 1, tours[0].steps[1]);
    expect(onTourSkip).toHaveBeenCalledWith("main", 1);
  });

  it("does not navigate steps with arrow keys while typing in an input", async () => {
    renderOnborda();
    const input = await screen.findByRole("textbox", { name: "Card input" });

    await userEvent.click(input);
    await userEvent.keyboard("{ArrowRight}");

    expect(screen.getByRole("dialog", { name: "First step" })).toBeInTheDocument();
  });

  it("skips the tour with Escape and restores focus", async () => {
    const { onTourSkip } = renderManualOnborda({ interact: false });
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
      <OnbordaProvider
        defaultCurrentTour="main"
        defaultCurrentStep={1}
        defaultIsOnbordaVisible
      >
        <div id="first-target" style={{ position: "absolute", zIndex: "5" }}>
          Target
        </div>
        <Onborda steps={tours} interact cardComponent={TestCard}>
          <div />
        </Onborda>
      </OnbordaProvider>
    );

    expect(await screen.findByRole("dialog", { name: "Missing step" })).toBeInTheDocument();
    expect(screen.getByText("target-missing")).toBeInTheDocument();
  });

  it("supports externally controlled step changes", async () => {
    const onCurrentStepChange = vi.fn();
    const onStateChange = vi.fn();

    render(
      <ControlledOnborda
        initialState={{
          currentTour: "main",
          currentStep: 0,
          isOnbordaVisible: true,
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
      isOnbordaVisible: true,
    });
    expect(await screen.findByRole("dialog", { name: "Missing step" })).toBeInTheDocument();
  });

  it("supports externally controlled open state when closing", async () => {
    const onCurrentTourChange = vi.fn();
    const onOpenChange = vi.fn();
    const onStateChange = vi.fn();

    render(
      <ControlledOnborda
        initialState={{
          currentTour: "main",
          currentStep: 0,
          isOnbordaVisible: true,
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
      isOnbordaVisible: false,
    });
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });
});
