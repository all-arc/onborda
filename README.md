# Okido - Next.js onboarding flow
Okido is a lightweight onboarding flow that utilises [framer-motion](https://www.framer.com/motion/) for animations and [tailwindcss](https://tailwindcss.com/) for styling. Fully customisable pointers (tooltips) that can easily be used with [shadcn/ui](https://ui.shadcn.com/) for modern web applications.


## Getting started
```bash
# pnpm
pnpm add okido
```

### Global `layout.tsx`
```tsx
import { OkidoProvider, Okido } from "okido";
import { CustomCard } from "@/components/CustomCard";

// In your root layout component:
<OkidoProvider>
  <Okido steps={steps} cardComponent={CustomCard}>
    {children}
  </Okido>
</OkidoProvider>
```

### Components & `page.tsx`
Target anything in your app using the elements `id` attribute.
```tsx
<div id="okido-step1">Onboard Step</div>
```

### Optimized imports
The root import is convenient when you need both the overlay and the hook:

```tsx
import { Okido, OkidoProvider, useOkido } from "okido";
```

For smaller bundles, import only the part you need from a subpath:

```tsx
import { Okido } from "okido/okido";
import { OkidoProvider, useOkido } from "okido/context";
import type { CardComponentProps, Tour } from "okido/types";
```

The package publishes ESM, explicit `exports`, and `sideEffects: false` so Next.js and other modern bundlers can remove unused exports.

### Controlled and uncontrolled state
`OkidoProvider` works uncontrolled by default. Use `useOkido()` to start, close, and move tours from inside your app:

```tsx
<OkidoProvider>
  <Okido steps={steps} cardComponent={CustomCard}>
    {children}
  </Okido>
</OkidoProvider>
```

You can also set uncontrolled initial state with `default*` props:

```tsx
<OkidoProvider
  defaultCurrentTour="firsttour"
  defaultCurrentStep={0}
  defaultIsOkidoVisible
>
  <Okido steps={steps} cardComponent={CustomCard}>
    {children}
  </Okido>
</OkidoProvider>
```

For URL-driven tours, product analytics flows, or app-owned persistence, control the state from a parent component. When a controlled prop is provided, Okido calls the matching change callback and waits for the parent to update the prop:

```tsx
"use client";

import { useState } from "react";
import { OkidoProvider, Okido } from "okido";
import type { OkidoState } from "okido";

export function ControlledTour({ children }: { children: React.ReactNode }) {
  const [okido, setOkido] = useState<OkidoState>({
    currentTour: null,
    currentStep: 0,
    isOkidoVisible: false,
  });

  return (
    <OkidoProvider
      currentTour={okido.currentTour}
      currentStep={okido.currentStep}
      isOkidoVisible={okido.isOkidoVisible}
      onCurrentTourChange={(currentTour) =>
        setOkido((state) => ({ ...state, currentTour }))
      }
      onCurrentStepChange={(currentStep) =>
        setOkido((state) => ({ ...state, currentStep }))
      }
      onOpenChange={(isOkidoVisible) =>
        setOkido((state) => ({ ...state, isOkidoVisible }))
      }
      onStateChange={(state) => {
        // Optional: persist or track the full next state.
      }}
    >
      <Okido steps={steps} cardComponent={CustomCard}>
        {children}
      </Okido>
    </OkidoProvider>
  );
}
```

| Provider prop              | Type                              | Description |
|----------------------------|-----------------------------------|-------------|
| `currentTour`              | `string \| null`                  | Controlled active tour name. Use `null` when no tour is active. |
| `currentStep`              | `number`                          | Controlled active step index. |
| `isOkidoVisible`         | `boolean`                         | Controlled open state. |
| `defaultCurrentTour`       | `string \| null`                  | Initial tour name for uncontrolled usage. Defaults to `null`. |
| `defaultCurrentStep`       | `number`                          | Initial step index for uncontrolled usage. Defaults to `0`. |
| `defaultIsOkidoVisible`  | `boolean`                         | Initial open state for uncontrolled usage. Defaults to `false`. |
| `initialTours`             | `Tour[]`                          | Optional. Tours initially available from the provider registry. |
| `progressPersistence`      | `boolean \| OkidoProgressPersistenceOptions` | Optional. Persists provider progress to storage and restores it on mount. Defaults to `false`. |
| `onCurrentTourChange`      | `(tour: string \| null) => void`  | Called when Okido requests a tour change. |
| `onCurrentStepChange`      | `(step: number) => void`          | Called when Okido requests a step change. |
| `onOpenChange`             | `(open: boolean) => void`         | Called when Okido requests an open/closed state change. |
| `onStateChange`            | `(state: OkidoState) => void`   | Called with the complete next state for each Okido action. |

### Progress persistence
Use `progressPersistence` to resume an interrupted uncontrolled tour after reloads or route remounts. Passing `true` uses `window.localStorage` with the default key `okido:progress`.

```tsx
<OkidoProvider progressPersistence>
  <Okido steps={steps} cardComponent={CustomCard}>
    {children}
  </Okido>
</OkidoProvider>
```

You can customize the key or inject your own storage implementation:

```tsx
<OkidoProvider
  progressPersistence={{
    storageKey: "acme:onboarding-progress",
    restore: true,
  }}
>
  <Okido steps={steps} cardComponent={CustomCard}>
    {children}
  </Okido>
</OkidoProvider>
```

The stored payload is versioned and contains `{ currentTour, currentStep, isOkidoVisible, updatedAt }`. Use `clearPersistedProgress()` from `useOkido()` when you need to reset the saved progress:

```tsx
const { clearPersistedProgress } = useOkido();

<button onClick={clearPersistedProgress}>Reset onboarding progress</button>
```

### Tour registry
Use the provider registry when feature modules should own their own tours instead of passing every tour through one `steps` array. Registered tours are merged with the `steps` prop by tour name.

```tsx
import { useEffect } from "react";
import { useOkido } from "okido";

export function BillingTourRegistration() {
  const { registerTour } = useOkido();

  useEffect(() => {
    return registerTour({
      tour: "billing",
      steps: [
        {
          title: "Billing overview",
          content: "Review invoices and payment methods here.",
          selector: "#billing-overview",
        },
      ],
    });
  }, [registerTour]);

  return null;
}
```

Registry APIs are available from `useOkido()`:

```tsx
const {
  registeredTours,
  registerTour,
  registerTours,
  unregisterTour,
  startOkido,
} = useOkido();
```

You can render `Okido` without a `steps` prop when all tours come from the registry:

```tsx
<Okido cardComponent={CustomCard}>
  {children}
</Okido>
```

### Conditional and async steps
Add `when` to a step to include it conditionally. Conditions are evaluated before step counts, navigation, and callbacks.

```tsx
const steps: Tour[] = [
  {
    tour: "workspace",
    steps: [
      {
        title: "Invite teammates",
        content: "Add people to your workspace.",
        selector: "#invite",
        when: ({ tour }) => tour === "workspace",
      },
      {
        title: "Admin settings",
        content: "Only admins see this step.",
        selector: "#admin-settings",
        when: currentUser.role === "admin",
      },
    ],
  },
];
```

`steps` can also be an async loader:

```tsx
<Okido
  steps={async () => {
    const response = await fetch("/api/onboarding");
    return response.json();
  }}
  cardComponent={CustomCard}
  onStepsLoadStart={() => console.log("loading tours")}
  onStepsLoadSuccess={(tours) => console.log("loaded", tours.length)}
  onStepsLoadError={(error) => console.error(error)}
>
  {children}
</Okido>
```

### Analytics hooks
Use `onAnalyticsEvent` for one consolidated stream across tour lifecycle, step navigation, route transitions, missing targets, and async step loading.

```tsx
<Okido
  steps={steps}
  cardComponent={CustomCard}
  onAnalyticsEvent={(event) => {
    analytics.track(event.type, event);
  }}
>
  {children}
</Okido>
```

### Dev warnings and debug mode
Set `devWarnings` when you want runtime warnings for configuration issues while building tours. Debug mode also enables these warnings and emits namespaced debug events.

```tsx
<Okido
  steps={steps}
  cardComponent={CustomCard}
  devWarnings
  debug={{
    log: false,
    onEvent: (event) => {
      console.debug(event.type, event.message, event.data);
    },
  }}
>
  {children}
</Okido>
```

Warnings are deduped by issue and cover invalid selectors, missing active tours, empty tours, async loader failures, and missing targets. Route target timeouts still use `console.warn` even without `devWarnings`.

### Mobile placement presets
Use `mobilePlacement` when the card should use a different placement on narrow screens. The default breakpoint is `768px`.

```tsx
<Okido
  steps={steps}
  cardComponent={CustomCard}
  mobilePlacement={{
    breakpoint: 640,
    placement: "bottom",
    fallbackPlacements: ["bottom", "top"],
    offset: 16,
    shiftPadding: 12,
  }}
>
  {children}
</Okido>
```

Supported presets are `"auto"`, `"top"`, `"bottom"`, and `"center"`. `"auto"` keeps the step's desktop `side`, while `"center"` keeps the target spotlight but renders the card in the viewport center with `arrow: null`. Use `step.mobileSide` when a specific step needs to override the global mobile preset.

### Target missing policy
By default, if a step selector does not match an element, Okido keeps the tour open and renders the same custom card in the center of the viewport with `targetFound: false` and `arrow: null`.

Use `targetMissingPolicy` when a missing target should be handled automatically:

```tsx
<Okido
  steps={steps}
  cardComponent={CustomCard}
  targetMissingPolicy="skip-step"
  onTargetMissing={(tour, stepIndex, step) => {
    console.warn(`Missing target for ${tour} step ${stepIndex}: ${step.selector}`);
  }}
>
  {children}
</Okido>
```

| Policy        | Behavior |
|---------------|----------|
| `fallback`    | Default. Render the card in the viewport center and keep the tour recoverable. |
| `skip-step`   | Skip the missing step. Next navigation skips forward; previous navigation skips backward. If there is no step to skip to, the tour completes when moving forward or skips when moving backward. |
| `skip-tour`   | Call `onTargetMissing`, trigger the same skip flow as `skipTour`, and close the tour. |

### Route transition hooks
For multi-page tours using `nextRoute` or `prevRoute`, Okido exposes hooks around its internal route transition flow. These hooks are scoped to tour step transitions, not global Next.js route events.

```tsx
<Okido
  steps={steps}
  cardComponent={CustomCard}
  onRouteTransitionStart={(transition) => {
    console.log("route start", transition.route);
  }}
  onRouteTransitionComplete={(transition) => {
    console.log("route complete", transition.targetFound);
  }}
  onRouteTransitionTimeout={(transition) => {
    console.warn("target timed out", transition.toStep.selector);
  }}
  onRouteTransitionError={(transition, error) => {
    console.error("route failed", transition.route, error);
  }}
>
  {children}
</Okido>
```

| Hook | When it fires |
|------|---------------|
| `onRouteTransitionStart` | Immediately before `router.push(route)` for `nextRoute` or `prevRoute`. |
| `onRouteTransitionComplete` | After the next target is found, or after the 5-second timeout moves the tour into fallback mode. Includes `targetFound`. |
| `onRouteTransitionTimeout` | When the target selector is still missing after 5 seconds. |
| `onRouteTransitionError` | When route navigation throws. The current step remains active. |

### Accessibility API
Okido labels the card wrapper as a `dialog` by default using the current step title. Use `accessibility` when you need stronger semantics, custom labels, or card-managed `aria-labelledby` / `aria-describedby`.

```tsx
<Okido
  steps={steps}
  cardComponent={CustomCard}
  accessibility={{
    dialogRole: "alertdialog",
    ariaModal: true,
    useCardLabelIds: true,
    liveRegion: "polite",
    progressText: ({ currentStep, totalSteps }) =>
      `Step ${currentStep + 1} of ${totalSteps}`,
  }}
>
  {children}
</Okido>
```

When `useCardLabelIds` is enabled, wire the generated IDs into your custom card:

```tsx
import type { CardComponentProps } from "okido";

export function CustomCard({ step, a11y }: CardComponentProps) {
  return (
    <section>
      <h2 {...a11y.titleProps}>{step.title}</h2>
      <div {...a11y.descriptionProps}>{step.content}</div>
      <p>{a11y.progressText}</p>
    </section>
  );
}
```

You can also provide explicit label resolvers:

```tsx
<Okido
  steps={steps}
  cardComponent={CustomCard}
  accessibility={{
    ariaLabel: ({ step }) => `Onboarding: ${step.title}`,
    ariaDescribedBy: "onboarding-description",
  }}
>
  {children}
</Okido>
```

### Tailwind config
Tailwind CSS will need to scan the node module in order to include the classes used by the overlay wrapper. See [configuring source paths](https://tailwindcss.com/docs/content-configuration#configuring-source-paths) for more information about this topic.

```ts
const config: Config = {
  content: [
    './node_modules/okido/dist/**/*.{js,ts,jsx,tsx}' // Add this
  ]
}
```

### Custom Card 
Okido requires a custom card component. This keeps the library focused on positioning, spotlight, routing, and lifecycle behavior while giving you complete control over the card UI.

| Prop          | Type             | Description                                                          |
|---------------|------------------|----------------------------------------------------------------------|
| `step`         | `Step`           | The current `Step` object from your steps array, including content, title, etc.         |
| `currentStep`   | `number`         | The index of the current step in the steps array (0-indexed).        |
| `totalSteps`    | `number`         | The total number of steps in the onboarding process.                 |
| `nextStep`      | `() => void`     | A function to advance to the next step in the onboarding process.    |
| `prevStep`      | `() => void`     | A function to go back to the previous step in the onboarding process.|
| `skipTour`      | `() => void`     | A function to skip the current tour and trigger `onTourSkip`. |
| `closeOkido`  | `() => void`     | A function to close the tour without firing the skip callback. |
| `isFirstStep`   | `boolean`        | Indicates whether the current step is the first step. |
| `isLastStep`    | `boolean`        | Indicates whether the current step is the last step. |
| `targetFound`   | `boolean`        | Indicates whether the current selector matched an element. |
| `arrow`         | `ReactElement \| null` | Returns an SVG arrow element when a target is found. It is `null` when the card is rendered in fallback mode. |
| `a11y`          | `OkidoCardAccessibilityProps` | Generated IDs and helper props for connecting your card title/description to the dialog wrapper. |
| `headless`      | `OkidoHeadlessHelpers` | Generated button prop getters and state flags for wiring card controls without manually binding Okido actions. |

```tsx
"use client"
import type { CardComponentProps } from "okido";

export const CustomCard = ({
  step,
  currentStep,
  totalSteps,
  isLastStep,
  targetFound,
  arrow,
  a11y,
  headless,
}: CardComponentProps) => {
  return (
    <div aria-live="polite">
      <h1 {...a11y.titleProps}>{step.icon} {step.title}</h1>
      <h2>{headless.progressText || `${currentStep + 1} of ${totalSteps}`}</h2>
      <p {...a11y.descriptionProps}>{step.content}</p>
      {!targetFound && <p>The highlighted element is not currently available.</p>}
      <button {...headless.getPrevButtonProps()}>Previous</button>
      <button {...headless.getNextButtonProps()}>
        {isLastStep ? "Finish" : "Next"}
      </button>
      <button {...headless.getSkipButtonProps()}>Skip</button>
      {arrow ?? null}
    </div>
  )
}
```

`headless` keeps the UI fully custom while supplying stable control wiring. The button prop getters merge your props, set `type="button"`, provide default aria labels, and call the matching Okido action after your `onClick` unless the event is prevented.

### Steps object
Okido supports multiple "tours", allowing you to define distinct walkthroughs for different parts of your application. The `steps` prop expects an array of `Tour` objects as shown below:

```tsx
import { Tour } from "okido";

const steps: Tour[] = [
  {
    tour: "first-tour",
    steps: [
      // Step objects
    ]
  },
  {
    tour: "second-tour",
    steps: [
      // Step objects
    ]
  }
];
```

### Step object

| Prop           | Type                          | Description                                                                           |
|----------------|-------------------------------|---------------------------------------------------------------------------------------|
| `icon`           | `React.ReactNode`, `string`, `null` | Optional. An icon or element to display alongside the step title.                                |
| `title`          | `string`                        | The title of your step                     |
| `content`        | `React.ReactNode`               | The main content or body of the step.                                                 |
| `selector`       | `string`                        | A CSS selector string targeting the HTML element this step highlights (e.g. `#my-element`).            |
| `side`           | `"top"` \| `"bottom"` \| `"left"` \| `"right"` \| `"top-left"` \| `"top-right"` \| `"bottom-left"` \| `"bottom-right"` \| `"left-top"` \| `"left-bottom"` \| `"right-top"` \| `"right-bottom"` | Optional. Determines where the tooltip should appear relative to the selector. Defaults to `"bottom"`. |
| `mobileSide`     | `"auto"` \| `"top"` \| `"bottom"` \| `"center"` \| any `side` value | Optional. Overrides `side` and the global `mobilePlacement` for this step on mobile viewports. |
| `showControls`   | `boolean`                       | Optional metadata you can use inside your custom card component to decide whether controls should be shown.           |
| `pointerPadding` | `number`                        | Optional. The padding around the spotlight (keyhole) highlighting the target element. Defaults to `30`. |
| `pointerRadius`  | `number`                        | Optional. The border-radius of the spotlight highlighting the target element. Defaults to `28`. |
| `spotlightShape` | `"rect"` \| `"circle"`          | Optional. Controls whether the spotlight cutout shape is a rectangle or circle. Defaults to `"rect"`. |
| `when`           | `boolean \| (context: StepConditionContext) => boolean` | Optional. Includes or excludes this step before rendering and navigation. |
| `nextRoute`      | `string`                        | Optional. The route to navigate to using `next/navigation` when moving to the next step.                      |
| `prevRoute`      | `string`                        | Optional. The route to navigate to using `next/navigation` when moving to the previous step.                  |

> **Note** _For `nextRoute` and `prevRoute`, Okido waits for the next selector to appear after `router.push`. If it is not found within 5 seconds, the same card is rendered in fallback mode with `targetFound: false` and `arrow: null`._

### Example `steps`

```tsx
import { Tour } from "okido";

export const steps: Tour[] = [
  {
    tour: "firsttour",
    steps: [
      {
        icon: <>👋</>,
        title: "Tour 1, Step 1",
        content: <>First tour, first step</>,
        selector: "#tour1-step1",
        side: "top",
        showControls: true,
        pointerPadding: 10,
        pointerRadius: 10,
        spotlightShape: "rect",
        nextRoute: "/foo",
        prevRoute: "/bar"
      }
    ]
  },
  {
    tour: "secondtour",
    steps: [
      {
        icon: <>👋👋</>,
        title: "Second tour, Step 1",
        content: <>Second tour, first step!</>,
        selector: "#okido-step1",
        side: "bottom-left",
        showControls: true,
        pointerPadding: 10,
        pointerRadius: 10,
        spotlightShape: "circle"
      }
    ]
  }
];
```

### Okido Props

| Property        | Type                  | Description                                                                           |
|-----------------|-----------------------|---------------------------------------------------------------------------------------|
| `children`      | `React.ReactNode`     | Your website or application content.                                                  |
| `interact`      | `boolean`             | Optional. Controls whether the onboarding overlay should be interactive. Defaults to `false`. |
| `steps`         | `Tour[] \| TourResolver` | Optional. Tours or an async tour loader. You may omit this when using only the provider registry. |
| `shadowRgb`     | `string`              | Optional. The RGB values for the shadow color surrounding the target area. Defaults to black `"0,0,0"`.      |
| `shadowOpacity` | `string`              | Optional. The opacity value for the shadow surrounding the target area. Defaults to `"0.2"`          |
| `cardComponent` | `ComponentType<CardComponentProps>` | Required. A custom React component used to render the card/tooltip. |
| `cardTransition`| `Transition`          | Transitions between steps. Accepts framer-motion `Transition` configurations. Example: `{{ type: "spring" }}`. |
| `targetMissingPolicy` | `"fallback"` \| `"skip-step"` \| `"skip-tour"` | Optional. Controls what happens when the current step selector does not match an element. Defaults to `"fallback"`. |
| `accessibility` | `OkidoAccessibilityOptions` | Optional. Controls dialog role, aria labels, aria descriptions, modal semantics, progress text, and live region announcements. |
| `mobilePlacement` | `OkidoMobilePlacement` | Optional. Changes card placement below a mobile breakpoint. Accepts `"auto"`, `"top"`, `"bottom"`, `"center"`, or an options object. |
| `devWarnings` | `boolean` | Optional. Enables one-time development warnings for invalid selectors, missing tours, empty tours, async loader errors, and missing targets. Enabled automatically in React/Next development mode. |
| `debug` | `boolean \| OkidoDebugOptions` | Optional. Enables debug events and namespaced `console.debug` output. Passing `debug={{ log: false, onEvent }}` captures events without console output. |
| `onStepsLoadStart` | `() => void` | Optional. Callback function triggered before an async `steps` loader runs. |
| `onStepsLoadSuccess` | `(tours: Tour[]) => void` | Optional. Callback function triggered after an async `steps` loader resolves. |
| `onStepsLoadError` | `(error: unknown) => void` | Optional. Callback function triggered when an async `steps` loader rejects. |
| `onAnalyticsEvent` | `(event: OkidoAnalyticsEvent) => void` | Optional. Consolidated analytics callback for lifecycle, navigation, route, target, and async loader events. |
| `onTourStart`   | `(tour: string) => void` | Optional. Callback function triggered when a tour begins. |
| `onStepChange`  | `(tour: string, stepIndex: number, step: Step) => void` | Optional. Callback function triggered whenever the active step changes. |
| `onTargetMissing` | `(tour: string, stepIndex: number, step: Step) => void` | Optional. Callback function triggered once when the current selector cannot be found. |
| `onRouteTransitionStart` | `(transition: RouteTransition) => void` | Optional. Callback function triggered before a routed step transition starts. |
| `onRouteTransitionComplete` | `(transition: RouteTransitionComplete) => void` | Optional. Callback function triggered after a routed step transition resolves. |
| `onRouteTransitionTimeout` | `(transition: RouteTransition) => void` | Optional. Callback function triggered when a routed target is not found within 5 seconds. |
| `onRouteTransitionError` | `(transition: RouteTransition, error: unknown) => void` | Optional. Callback function triggered when routed navigation throws. |
| `onTourComplete`| `(tour: string) => void` | Optional. Callback function triggered when a tour has been successfully completed. |
| `onTourSkip`    | `(tour: string, currentStep: number) => void` | Optional. Callback function triggered when the user skips or closes the tour. |

```tsx
<Okido
  steps={steps}
  shadowRgb="55,48,163"
  shadowOpacity="0.8"
  cardComponent={CustomCard}
  cardTransition={{ duration: 2, type: "tween" }}
>
  {children}
</Okido>
```

## Next.js Integration Guide

Okido is designed specifically for the Next.js App Router (using standard Client Components and `next/navigation`). Below are common implementation patterns for modern Next.js applications.

### 1. Basic Setup (App Router)

Since `OkidoProvider` and `Okido` are Client Components under the hood (marked with `"use client"`), you can import and wrap them directly in your root layout.

```tsx
// app/layout.tsx
import { OkidoProvider, Okido } from "okido";
import { steps } from "@/config/steps";
import CustomCard from "@/components/CustomCard";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <OkidoProvider>
          <Okido
            steps={steps}
            cardComponent={CustomCard}
          >
            {children}
          </Okido>
        </OkidoProvider>
      </body>
    </html>
  );
}
```

---

### 2. Controlling Tours Dynamically (`useOkido`)

To launch or exit a tour programmatically (for example, when a user clicks a "Help" button, or on their first login), use the `useOkido` hook inside any **Client Component**.

```tsx
// components/TourControls.tsx
"use client";

import { useOkido } from "okido";

export default function TourControls() {
  const { startOkido, closeOkido } = useOkido();

  return (
    <div className="flex gap-2">
      <button 
        onClick={() => startOkido("firsttour")}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        Start Tour
      </button>
      
      <button 
        onClick={closeOkido}
        className="border px-4 py-2 rounded"
      >
        Skip Tour
      </button>
    </div>
  );
}
```

---

### 3. Multi-page Tours & Routing

If your onboarding flow spans multiple pages, specify `nextRoute` and `prevRoute` on the steps. Okido uses Next.js `useRouter` internally to seamlessly navigate.

```tsx
// config/steps.ts
export const steps = [
  {
    tour: "firsttour",
    steps: [
      {
        title: "Welcome!",
        content: "Let's start the onboarding here.",
        selector: "#step-1",
        side: "bottom",
        nextRoute: "/dashboard", // Navigates to /dashboard when 'Next' is clicked
      },
      {
        title: "Your Dashboard",
        content: "Here is your main console.",
        selector: "#step-2",
        side: "right",
        prevRoute: "/", // Navigates back to the homepage if 'Prev' is clicked
      }
    ]
  }
];
```

> [!TIP]
> **How Routing Works Under the Hood:**
> When the user clicks "Next", Okido triggers `router.push(nextRoute)` and establishes a `MutationObserver` on the body. Once the new page loads and the element matching `selector` mounts, the tooltip instantly reappears at that element. There is a built-in 5-second safety timeout.

---

### 4. Persisting Tour Completion State (e.g., Database or Cookies)

To prevent users from seeing the tour every time they visit, you can use the Okido lifecycle callbacks to save their progress to your database or local storage.

#### Example: Using Server Actions to save tour completion

```tsx
// app/layout.tsx
"use client";

import { OkidoProvider, Okido } from "okido";
import CustomCard from "@/components/CustomCard";
import { steps } from "@/config/steps";
import { updateUserTourCompletion } from "@/app/actions"; // Your Server Action

export default function RootLayout({ children }) {
  
  const handleTourComplete = async (tourName: string) => {
    // Call server action or API route to persist completion state
    await updateUserTourCompletion(tourName);
  };

  return (
    <html lang="en">
      <body>
        <OkidoProvider>
          <Okido
            steps={steps}
            cardComponent={CustomCard}
            onTourComplete={handleTourComplete}
          >
            {children}
          </Okido>
        </OkidoProvider>
      </body>
    </html>
  );
}
```
