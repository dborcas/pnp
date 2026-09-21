import { fireEvent, screen } from "@testing-library/react";
import { renderWithProviders } from "../../utils/test-utils.tsx";
import { MarkupCamera } from "./MarkupCamera.tsx";

const renderMarkupCamera = () => {
  return renderWithProviders(
    <MarkupCamera
      mainCamera={null}
      setMainCamera={vi.fn()}
      hasMainCamera={false}
      showToolbars={true}
      drawingEnabled={false}
      setDrawingEnabled={vi.fn()}
      canvasId="main-canvas"
    />,
  );
};

describe("MarkupCamera", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test("rotates the camera with toolbar controls", async () => {
    renderMarkupCamera();

    fireEvent.click(
      screen.getByRole("button", { name: "rotate camera right" }),
    );

    const camera = await screen.findByTestId("markup-camera-surface");
    expect(camera).toHaveStyle({ transform: "rotate(90deg) scale(1.2)" });
    expect(localStorage.getItem("pnp.camera.rotation")).toBe("90");
  });

  test("keeps rotation when command zero resets zoom", async () => {
    localStorage.setItem("pnp.camera.rotation", "90");
    renderMarkupCamera();

    fireEvent.keyDown(window, { key: "0", metaKey: true });

    const camera = await screen.findByTestId("markup-camera-surface");
    expect(camera).toHaveStyle({ transform: "rotate(90deg) scale(1)" });
  });
});
