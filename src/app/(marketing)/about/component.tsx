import { H1 } from "@/components/dialog-headings";
import { Link } from "@/components/link";

export function About() {
  return (
    <>
      <H1 className="">
        <i>Welcome</i> to Infinite Canvas
      </H1>
      <p>an infinite canvas image editor with AI transformations</p>
      <p>
        <b>Vision: </b> Infinite Canvas is a powerful image editing platform
        that combines infinite canvas capabilities with cutting-edge AI
        transformations. Create, edit, and transform images using advanced AI
        models powered by fal.ai. Upload your own images or generate new
        content, then apply stunning AI-powered effects and transformations in
        real-time.
      </p>

      <p>
        <b>Features: </b> Infinite canvas with pan/zoom, drag & drop image
        upload, AI style transfer via Flux Kontext LoRA, background removal and
        object isolation, real-time streaming of AI results, multi-selection and
        image manipulation, auto-save to IndexedDB, and undo/redo support.
      </p>

      <p>
        <b>AI Capabilities: </b> Transform images with style transfer using Flux
        Kontext LoRA, remove backgrounds with Bria's specialized model, isolate
        objects using EVF-SAM for semantic segmentation, and generate new
        content with text-to-image capabilities. All AI features provide
        real-time streaming updates for a smooth user experience.
      </p>

      <p>
        <b>Status: </b> This project is actively being developed and optimized.
        Current focus includes improving AI generation capabilities, enhancing
        performance with viewport culling and streaming optimizations, and
        expanding the range of AI models and transformations available.
      </p>

      <p>
        Start creating amazing AI-powered artwork today! Follow along on{" "}
        <Link href="https://x.com/hhwjsw711">twitter</Link> or{" "}
        <Link href="https://github.com/hhwjsw711/infinite-canvas">github</Link>.
      </p>
    </>
  );
}
