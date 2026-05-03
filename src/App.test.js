import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import App from "./App";

describe("App", () => {
  it("renders fanbase navigation", () => {
    render(<App />);
    expect(
      screen.getByRole("button", { name: /matchs du jour/i }),
    ).toBeInTheDocument();
  });
});
