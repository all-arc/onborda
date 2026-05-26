import React from "react";
import { describe, expectTypeOf, it } from "vitest";
import type { CardComponentProps, OnbordaProps } from "./types";

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
    }>();

    expectTypeOf<OnbordaProps>().toMatchTypeOf<{
      cardComponent: React.ComponentType<CardComponentProps>;
    }>();

    const props = {
      children: null,
      steps: [],
      cardComponent: Card,
    } satisfies OnbordaProps;

    expectTypeOf(props.cardComponent).toEqualTypeOf<typeof Card>();
  });
});
