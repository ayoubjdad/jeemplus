import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import App from "./App";

describe("App", () => {
  it("renders landing page", () => {
    render(<App />);
    expect(
      screen.getByRole("heading", { name: /meilleures ligues/i }),
    ).toBeInTheDocument();
  });
});
