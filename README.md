# Onborda - Next.js onboarding flow
Onborda is a lightweight onboarding flow that utilises [framer-motion](https://www.framer.com/motion/) for animations and [tailwindcss](https://tailwindcss.com/) for styling. Fully customisable pointers (tooltips) that can easily be used with [shadcn/ui](https://ui.shadcn.com/) for modern web applications.

- **Demo - [onborda.vercel.app](https://onborda.vercel.app)**
- **[Demo repository](https://github.com/uixmat/onborda-demo)**


## Getting started
```bash
# npm
npm i onborda
# pnpm
pnpm add onborda
# yarn
yarn add onborda
```

### Global `layout.tsx`
```tsx
import { OnbordaProvider, Onborda } from "onborda";

// In your root layout component:
<OnbordaProvider>
  <Onborda steps={steps}>
    {children}
  </Onborda>
</OnbordaProvider>
```

### Components & `page.tsx`
Target anything in your app using the elements `id` attribute.
```tsx
<div id="onborda-step1">Onboard Step</div>
```

### Tailwind config
Tailwind CSS will need to scan the node module in order to include the classes used. See [configuring source paths](https://tailwindcss.com/docs/content-configuration#configuring-source-paths) for more information about this topic.

> **Note**: You only require this if you are **not using** a custom component.

```ts
const config: Config = {
  content: [
    './node_modules/onborda/dist/**/*.{js,ts,jsx,tsx}' // Add this
  ]
}
```

### Custom Card 
If you require greater control over the card design or simply wish to create a totally custom component then you can do so easily.

| Prop          | Type             | Description                                                          |
|---------------|------------------|----------------------------------------------------------------------|
| `step`         | `Step`           | The current `Step` object from your steps array, including content, title, etc.         |
| `currentStep`   | `number`         | The index of the current step in the steps array (0-indexed).        |
| `totalSteps`    | `number`         | The total number of steps in the onboarding process.                 |
| `nextStep`      | `() => void`     | A function to advance to the next step in the onboarding process.    |
| `prevStep`      | `() => void`     | A function to go back to the previous step in the onboarding process.|
| `arrow`         | `ReactElement`   | Returns an SVG arrow element whose orientation is automatically controlled. |

```tsx
"use client"
import type { CardComponentProps } from "onborda";

export const CustomCard = ({
  step,
  currentStep,
  totalSteps,
  nextStep,
  prevStep,
  arrow,
}: CardComponentProps) => {
  return (
    <div>
      <h1>{step.icon} {step.title}</h1>
      <h2>{currentStep + 1} of {totalSteps}</h2>
      <p>{step.content}</p>
      <button onClick={prevStep}>Previous</button>
      <button onClick={nextStep}>Next</button>
      {arrow}
    </div>
  )
}
```

### Steps object
Onborda supports multiple "tours", allowing you to define distinct walkthroughs for different parts of your application. The `steps` prop expects an array of `Tour` objects as shown below:

```tsx
import { Tour } from "onborda";

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
| `showControls`   | `boolean`                       | Optional. Determines whether control buttons (next, prev) should be shown if using the default card.           |
| `pointerPadding` | `number`                        | Optional. The padding around the spotlight (keyhole) highlighting the target element. Defaults to `30`. |
| `pointerRadius`  | `number`                        | Optional. The border-radius of the spotlight highlighting the target element. Defaults to `28`. |
| `spotlightShape` | `"rect"` \| `"circle"`          | Optional. Controls whether the spotlight cutout shape is a rectangle or circle. Defaults to `"rect"`. |
| `nextRoute`      | `string`                        | Optional. The route to navigate to using `next/navigation` when moving to the next step.                      |
| `prevRoute`      | `string`                        | Optional. The route to navigate to using `next/navigation` when moving to the previous step.                  |

> **Note** _Both `nextRoute` and `prevRoute` have a `500`ms delay before setting the next step to allow for page transitions. Future versions will add controls to customize this delay._

### Example `steps`

```tsx
import { Tour } from "onborda";

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
        selector: "#onborda-step1",
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

### Onborda Props

| Property        | Type                  | Description                                                                           |
|-----------------|-----------------------|---------------------------------------------------------------------------------------|
| `children`      | `React.ReactNode`     | Your website or application content.                                                  |
| `interact`      | `boolean`             | Optional. Controls whether the onboarding overlay should be interactive. Defaults to `false`. |
| `steps`         | `Tour[]`              | An array of `Tour` objects defining each tour in your onboarding process.              |
| `showOnborda`   | `boolean`             | Optional. Controls the visibility of the onboarding overlay, eg. if the user is a first time visitor. Defaults to `false`.                         |
| `shadowRgb`     | `string`              | Optional. The RGB values for the shadow color surrounding the target area. Defaults to black `"0,0,0"`.      |
| `shadowOpacity` | `string`              | Optional. The opacity value for the shadow surrounding the target area. Defaults to `"0.2"`          |
| `cardComponent` | `ComponentType<CardComponentProps>` | Optional. A custom React component used to render the card/tooltip. |
| `cardTransition`| `Transition`          | Transitions between steps. Accepts framer-motion `Transition` configurations. Example: `{{ type: "spring" }}`. |
| `onTourStart`   | `(tour: string) => void` | Optional. Callback function triggered when a tour begins. |
| `onStepChange`  | `(tour: string, stepIndex: number, step: Step) => void` | Optional. Callback function triggered whenever the active step changes. |
| `onTourComplete`| `(tour: string) => void` | Optional. Callback function triggered when a tour has been successfully completed. |
| `onTourSkip`    | `(tour: string, currentStep: number) => void` | Optional. Callback function triggered when the user skips or closes the tour. |

```tsx
<Onborda
  steps={steps}
  showOnborda={true}
  shadowRgb="55,48,163"
  shadowOpacity="0.8"
  cardComponent={CustomCard}
  cardTransition={{ duration: 2, type: "tween" }}
>
  {children}
</Onborda>
```

## Next.js Integration Guide

Onborda is designed specifically for the Next.js App Router (using standard Client Components and `next/navigation`). Below are common implementation patterns for modern Next.js applications.

### 1. Basic Setup (App Router)

Since `OnbordaProvider` and `Onborda` are Client Components under the hood (marked with `"use client"`), you can import and wrap them directly in your root layout.

```tsx
// app/layout.tsx
import { OnbordaProvider, Onborda } from "onborda";
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
        <OnbordaProvider>
          <Onborda 
            steps={steps}
            showOnborda={true} // Set to true/false dynamically or control via useOnborda hook
            cardComponent={CustomCard}
          >
            {children}
          </Onborda>
        </OnbordaProvider>
      </body>
    </html>
  );
}
```

---

### 2. Controlling Tours Dynamically (`useOnborda`)

To launch or exit a tour programmatically (for example, when a user clicks a "Help" button, or on their first login), use the `useOnborda` hook inside any **Client Component**.

```tsx
// components/TourControls.tsx
"use client";

import { useOnborda } from "onborda";

export default function TourControls() {
  const { startOnborda, closeOnborda } = useOnborda();

  return (
    <div className="flex gap-2">
      <button 
        onClick={() => startOnborda("firsttour")}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        Start Tour
      </button>
      
      <button 
        onClick={closeOnborda}
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

If your onboarding flow spans multiple pages, specify `nextRoute` and `prevRoute` on the steps. Onborda uses Next.js `useRouter` internally to seamlessly navigate.

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
> When the user clicks "Next", Onborda triggers `router.push(nextRoute)` and establishes a `MutationObserver` on the body. Once the new page loads and the element matching `selector` mounts, the tooltip instantly reappears at that element. There is a built-in 5-second safety timeout.

---

### 4. Persisting Tour Completion State (e.g., Database or Cookies)

To prevent users from seeing the tour every time they visit, you can use the Onborda lifecycle callbacks to save their progress to your database or local storage.

#### Example: Using Server Actions to save tour completion

```tsx
// app/layout.tsx
"use client";

import { OnbordaProvider, Onborda } from "onborda";
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
        <OnbordaProvider>
          <Onborda 
            steps={steps}
            onTourComplete={handleTourComplete}
          >
            {children}
          </Onborda>
        </OnbordaProvider>
      </body>
    </html>
  );
}
```

