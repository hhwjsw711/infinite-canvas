import { BuyCreditsModal } from "./buy-credits";
import { CreateStudioModal } from "./create-studio";
import { CreateCanvasModal } from "./create-canvas";

export function GlobalModals() {
  return (
    <>
      <CreateStudioModal />
      <BuyCreditsModal />
      <CreateCanvasModal />
    </>
  );
}
