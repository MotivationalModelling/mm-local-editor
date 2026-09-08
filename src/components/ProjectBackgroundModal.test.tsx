// @vitest-environment jsdom

import {cleanup, fireEvent, render, screen} from "@testing-library/react";
import {useState} from "react";
import {afterEach, describe, expect, it, vi} from "vitest";

import ProjectBackgroundModal from "./ProjectBackgroundModal";

afterEach(cleanup);

describe("ProjectBackgroundModal", () => {
  it("requires a project background and confirms with its trimmed value", () => {
    const handleConfirm = vi.fn();

    const Harness = () => {
      const [projectBackground, setProjectBackground] = useState("");
      return (
        <ProjectBackgroundModal
          show
          projectBackground={projectBackground}
          onProjectBackgroundChange={setProjectBackground}
          onCancel={() => undefined}
          onConfirm={handleConfirm}
        />
      );
    };

    render(<Harness />);

    const generateButton = screen.getByRole("button", {name: "Generate"}) as HTMLButtonElement;
    expect(generateButton.disabled).toBe(true);

    fireEvent.change(screen.getByLabelText("Project background"), {
      target: {value: "  A course discussion platform.  "},
    });

    expect(generateButton.disabled).toBe(false);
    fireEvent.click(generateButton);
    expect(handleConfirm).toHaveBeenCalledWith("A course discussion platform.");
  });
});
