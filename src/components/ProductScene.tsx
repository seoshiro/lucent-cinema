import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import type { CinemaScene, Finish } from '../lib/scene-model';
import type { ProductState, RendererInput, RendererOutput } from '../workers/product-renderer';
import './product-scene.css';

export type { CinemaScene, Finish } from '../lib/scene-model';

export interface ProductSceneProps {
  scrollProgress: number;
  finish: Finish;
  scene: CinemaScene;
  motionEnabled: boolean;
}

function fallbackOpacity(progress: number) {
  const smooth = (value: number) => value * value * (3 - 2 * value);
  if (progress <= 0.6 || progress >= 0.86) return 1;
  if (progress < 0.66) return 1 - smooth((progress - 0.6) / 0.06);
  if (progress <= 0.8) return 0;
  return smooth((progress - 0.8) / 0.06);
}

export default function ProductScene({ scrollProgress, finish, scene, motionEnabled }: ProductSceneProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const workerRef = useRef<Worker | null>(null);
  const valuesRef = useRef<ProductState>({ scrollProgress, finish, scene, motionEnabled });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const state = { scrollProgress, finish, scene, motionEnabled };
    valuesRef.current = state;
    workerRef.current?.postMessage({ type: 'update', state } satisfies RendererInput);
  }, [scrollProgress, finish, scene, motionEnabled]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    host.dataset.rendererStatus = 'fallback';
    if (typeof Worker === 'undefined' || typeof OffscreenCanvas === 'undefined'
      || !('transferControlToOffscreen' in HTMLCanvasElement.prototype)) return;
    let worker: Worker | undefined;
    let canvas: HTMLCanvasElement | undefined;
    let disposed = false;
    let failed = false;
    let intersecting = true;
    let resizeObserver: ResizeObserver | undefined;
    let intersectionObserver: IntersectionObserver | undefined;
    const send = (message: RendererInput) => {
      if (!disposed && !failed && worker) worker.postMessage(message);
    };
    const visibility = () => send({ type: 'visibility', visible: intersecting && !document.hidden });
    const fail = () => {
      if (disposed || failed) return;
      failed = true;
      host.dataset.rendererStatus = 'fallback';
      setReady(false);
      if (workerRef.current === worker) workerRef.current = null;
      worker?.terminate();
      canvas?.remove();
    };
    try {
      // Only the worker acquires a WebGL context. A main-thread probe would
      // repeat expensive GPU initialization before any work was transferred.
      canvas = document.createElement('canvas');
      canvas.className = 'product-scene__canvas';
      const offscreen = canvas.transferControlToOffscreen();
      worker = new Worker(new URL('../workers/product-renderer.ts', import.meta.url), { type: 'module', name: 'lucent-product-renderer' });
      workerRef.current = worker;
      host.appendChild(canvas);
      host.dataset.rendererStatus = 'loading';
      worker.onmessage = (event: MessageEvent<RendererOutput>) => {
        if (disposed || failed) return;
        const message = event.data;
        if (message.type === 'frame') host.style.setProperty('--model-opacity', String(message.alpha));
        else if (message.type === 'ready') { host.dataset.rendererStatus = 'ready'; setReady(true); }
        else if (message.type === 'contextlost') { host.dataset.rendererStatus = 'context-lost'; setReady(false); }
        else if (message.type === 'restored') host.dataset.rendererStatus = 'loading';
        else if (message.type === 'error') fail();
      };
      worker.onerror = (event) => { event.preventDefault(); fail(); };
      worker.onmessageerror = fail;
      const dimensions = () => {
        const bounds = host.getBoundingClientRect();
        return { width: Math.max(1, bounds.width), height: Math.max(1, bounds.height), dpr: Math.min(window.devicePixelRatio || 1, 1.5) };
      };
      worker.postMessage({ type: 'init', canvas: offscreen, state: valuesRef.current, size: dimensions(), visible: !document.hidden } satisfies RendererInput, [offscreen]);
      resizeObserver = new ResizeObserver(() => send({ type: 'resize', size: dimensions() }));
      resizeObserver.observe(host);
      intersectionObserver = new IntersectionObserver(([entry]) => {
        intersecting = entry.isIntersecting;
        visibility();
      });
      intersectionObserver.observe(host);
      document.addEventListener('visibilitychange', visibility);
    } catch {
      // Startup failures happen before ready=true, so the original SVG remains.
      failed = true;
      host.dataset.rendererStatus = 'fallback';
      if (workerRef.current === worker) workerRef.current = null;
      worker?.terminate();
      canvas?.remove();
    }
    return () => {
      disposed = true;
      document.removeEventListener('visibilitychange', visibility);
      resizeObserver?.disconnect();
      intersectionObserver?.disconnect();
      if (workerRef.current === worker) workerRef.current = null;
      // Termination also cancels an in-flight GPU initialization on StrictMode's
      // disposable mount; no stale worker message can mutate the next instance.
      worker?.terminate();
      canvas?.remove();
    };
  }, []);

  return (
    <div ref={hostRef} className={ready ? 'product-scene product-scene--ready' : 'product-scene'} style={{ '--fallback-opacity': fallbackOpacity(scrollProgress) } as CSSProperties} aria-hidden="true" data-finish={finish} data-motion={motionEnabled ? 'enabled' : 'reduced'}>
      <img className="product-scene__fallback" src={import.meta.env.BASE_URL + 'product-fallback.svg'} alt="" width="1200" height="900" draggable="false" />
    </div>
  );
}
