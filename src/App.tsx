import { useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import type { Finish, CinemaScene } from './components/ProductScene'
import CinemaWorld from './components/CinemaWorld'
import ProductScene from './components/ProductScene'
import { finishes, worlds, chapterProgress, worldVisibility, stageVisibility, finaleVisibility } from './lib/story.mjs'
import { animate, createScope } from 'animejs'

function Arrow({ diagonal = false }: { diagonal?: boolean }) {
  return <span aria-hidden="true">{diagonal ? '↗' : '↓'}</span>
}

export default function App() {
  const storyRef = useRef<HTMLDivElement>(null)
  const finishDescriptionRef = useRef<HTMLDivElement>(null)
  const previousFinish = useRef<Finish>('graphite')
  const finishFromPointer = useRef(false)
  const [progress, setProgress] = useState(0)
  const [stageAlpha, setStageAlpha] = useState(1)
  const [finish, setFinish] = useState<Finish>('graphite')
  const [scene, setScene] = useState<CinemaScene>('aurora')
  const [motionEnabled, setMotionEnabled] = useState(() => !window.matchMedia('(prefers-reduced-motion: reduce)').matches)

  useEffect(() => {
    const changed = previousFinish.current !== finish
    previousFinish.current = finish
    if (!changed || !finishFromPointer.current || !motionEnabled || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const scope = createScope({ root: finishDescriptionRef }).add(() => {
      animate(finishDescriptionRef.current!, { opacity: [.45, 1], duration: 180, ease: 'out(3)' })
    })
    return () => scope.revert()
  }, [finish, motionEnabled])

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onChange = (event: MediaQueryListEvent) => setMotionEnabled(!event.matches)
    preference.addEventListener('change', onChange)
    return () => preference.removeEventListener('change', onChange)
  }, [])

  useEffect(() => {
    let frame = 0
    const update = () => {
      frame = 0
      const bounds = storyRef.current?.getBoundingClientRect()
      const chapters = storyRef.current?.querySelectorAll<HTMLElement>('.chapter')
      if (bounds && chapters) {
        const stops = [0, .24, .44, .58, .70, .87, 1]
        const anchors = Array.from(chapters, (chapter, index) => ({ top: chapter.offsetTop, progress: stops[index] }))
        setProgress(Math.round(chapterProgress(-bounds.top, anchors) * 1000) / 1000)
        const viewport = window.innerHeight
        const finale = storyRef.current?.querySelector('.finale-copy')?.getBoundingClientRect()
        const copyClearance = window.innerWidth < viewport * .88 && finale ? finaleVisibility(finale.top, viewport) : 1
        setStageAlpha(Math.min(stageVisibility(bounds.bottom, viewport), copyClearance))
      }
    }
    const schedule = () => { if (!frame) frame = window.requestAnimationFrame(update) }
    // Native restoration can run before React adds enough document height.
    // Recover this tab's reload position without changing history entries or URLs.
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined
    let savedPosition: { url: string; y: number } | null = null
    if (navigation?.type === 'reload') {
      try {
        const saved = JSON.parse(window.sessionStorage.getItem('lucent:reading-position') ?? 'null')
        if (saved?.url === window.location.href && Number.isFinite(saved?.y) && saved.y >= 0) savedPosition = saved
      } catch { /* Native restoration remains available when tab storage is unavailable. */ }
    }
    if (savedPosition) {
      window.scrollTo({ top: savedPosition.y, behavior: 'instant' })
    } else if (navigation?.type === 'navigate' && window.scrollY === 0 && window.location.hash) {
      let targetId = ''
      try { targetId = decodeURIComponent(window.location.hash.slice(1)) } catch { /* Invalid fragments have no target. */ }
      const target = targetId ? document.getElementById(targetId) : null
      if (target && document.getElementById('main')?.contains(target)) target.scrollIntoView({ behavior: 'instant', block: 'start' })
    }
    const rememberPosition = () => {
      try {
        window.sessionStorage.setItem('lucent:reading-position', JSON.stringify({ url: window.location.href, y: Math.max(0, window.scrollY) }))
      } catch { /* Keep navigation usable when tab storage is unavailable. */ }
    }
    schedule()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    window.addEventListener('pagehide', rememberPosition)
    return () => {
      window.cancelAnimationFrame(frame)
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      window.removeEventListener('pagehide', rememberPosition)
    }
  }, [])

  const chosenFinish = finishes.find(item => item.id === finish)!
  const chosenWorld = worlds.find(item => item.id === scene)!
  const worldOpacity = worldVisibility(progress)
  const cinematic = progress > .54 && progress < .81
  const sceneStyle = {
    '--world-opacity': worldOpacity,
    '--stage-opacity': stageAlpha,
    '--world-shift': `${motionEnabled ? (progress - .68) * -90 : 0}px`,
    '--finish-color': chosenFinish.color,
    '--mobile-model-lift': `${Math.min(1, Math.max(0, (progress - .80) / .07)) * -18}svh`,
  } as CSSProperties

  return <>
    <a className="skip-link" href="#main">Skip to content</a>
    <header className="site-header">
      <a className="brand" href="#top"><span className="brand-mark" aria-hidden="true"/>LUCENT{' '}<span className="brand-edition">P / 01</span></a>
      <nav aria-label="Main navigation"><a href="#craft">The object</a><a href="#cinema">The experience</a><a href="#finishes">Finishes</a></nav>
      <a className="header-cta" href="#details">Discover P / 01 <Arrow diagonal/></a>
    </header>
    <main id="main">
      <div className={`story-track ${motionEnabled ? '' : 'motion-paused'}`} ref={storyRef} style={sceneStyle}>
        <div className={`visual-sticky ${cinematic ? 'is-cinema' : ''} ${stageAlpha === 0 ? 'is-out' : ''}`} aria-hidden="true">
          <div className="ambient ambient-warm"/>
          <div className="backdrop-word" style={{ opacity: Math.max(0, 1 - progress / .16) }}>LUCENT</div>
          <ProductScene scrollProgress={progress} finish={finish} scene={scene} motionEnabled={motionEnabled}/>
          <div className="cinema-layer"><CinemaWorld scene={scene} artworkEnabled={progress >= .36}/></div>
        </div>
        <div className="story-chapters">
          <section className="chapter hero" id="top" aria-labelledby="hero-title">
            <div className="hero-caption"><span className="tiny-label">LIGHT. UNCONTAINED.</span><span className="concept-tag">INDEPENDENT DESIGN CONCEPT <span aria-hidden="true">✳</span></span></div>
            <div className="hero-copy"><p className="eyebrow"><span className="orange-dot"/>INTRODUCING LUCENT P / 01</p><h1 id="hero-title">Small object.<br/>Endless cinema.</h1><p className="body-copy">A little less ordinary.<br/>A world beyond the frame.</p><a className="pill primary" href="#craft">Enter the experience <Arrow diagonal/></a></div>
            <div className="hero-bottom"><span>DESIGNED TO TAKE YOU SOMEWHERE</span><a href="#craft">SCROLL TO EXPLORE <Arrow/></a><span className="hero-coordinate">01 — 06</span></div>
          </section>
          <section className="chapter craft" id="craft" aria-labelledby="craft-title">
            <div className="chapter-copy align-left"><p className="eyebrow">01 / FORM, WITH FEELING</p><h2 id="craft-title">Nothing extra.<br/>Everything considered.</h2><p className="body-copy">A sculpted aluminum shell. A quiet rhythm of ventilation. One tactile dial. Every line has a reason to be here.</p><div className="detail-line"><span className="detail-number">01</span><span>SCULPTED OBJECT<br/>A STUDY IN RESTRAINT</span></div></div>
            <span className="technical-caption craft-caption">SOFT EDGES. PRECISE INTENT.<span className="callout-line"/></span>
          </section>
          <section className="chapter optics" id="optics" aria-labelledby="optics-title">
            <div className="chapter-copy align-left"><p className="eyebrow">02 / AT THE HEART OF IT</p><h2 id="optics-title">An invitation<br/>to look closer.</h2><p className="body-copy">Deep glass. Concentric detail. The lens becomes a doorway — from a beautifully simple object to something that feels limitless.</p><p className="micro-note">THE LENS / A WINDOW TO SOMEWHERE ELSE</p></div><span className="technical-caption optics-caption">LIGHT FINDS A WAY.</span>
          </section>
          <section className="chapter portal" aria-labelledby="portal-title"><div className="portal-copy"><p className="eyebrow">03 / GO BEYOND</p><h2 id="portal-title">The room ends.<br/>The story begins.</h2><p className="body-copy">Keep scrolling. There’s a whole world on the other side.</p></div></section>
          <section className="chapter cinema" id="cinema" aria-labelledby="cinema-title">
            <div className="cinema-heading"><p className="eyebrow">04 / A DIFFERENT KIND OF ESCAPE</p><h2 id="cinema-title">Be somewhere<br/><em>else.</em></h2></div>
            <div className="world-controls"><div><p className="tiny-label">CHOOSE YOUR WORLD</p><p className="world-description" aria-live="polite">{chosenWorld.description}</p></div><fieldset className="scene-picker"><legend className="sr-only">Cinema world</legend>{worlds.map((world, index) => <button key={world.id} type="button" aria-pressed={scene === world.id} onClick={() => setScene(world.id as CinemaScene)}><span className="option-index">0{index + 1}</span>{world.name}<span className="selection-indicator" aria-hidden="true">↗</span></button>)}</fieldset></div>
          </section>
          <section className="chapter finishes" id="finishes" aria-labelledby="finish-title">
            <div className="chapter-copy align-left"><p className="eyebrow">05 / MAKE IT YOURS</p><h2 id="finish-title">Three expressions.<br/>One point of view.</h2><p className="body-copy">The same sculpted silhouette, in a finish that feels like you.</p><fieldset className="finish-picker"><legend>EXPLORE THE FINISHES</legend>{finishes.map(item => <button key={item.id} type="button" aria-label={item.name} aria-pressed={finish === item.id} onClick={(event) => { finishFromPointer.current = event.detail > 0; setFinish(item.id as Finish) }} style={{ '--swatch': item.color } as CSSProperties}><span className="swatch"/><span>{item.name}</span></button>)}</fieldset><div ref={finishDescriptionRef} className="finish-description" aria-live="polite"><h3>{chosenFinish.name}</h3><p>{chosenFinish.description}</p></div></div>
          </section>
          <section className="chapter finale" aria-labelledby="finale-title"><div className="finale-copy"><p className="eyebrow">06 / LESS OBJECT. MORE POSSIBILITY.</p><h2 id="finale-title">Carry a little<br/><span>extraordinary.</span></h2><a className="pill primary" href="#details">Explore the design <Arrow diagonal/></a></div></section>
        </div>
      </div>
      <section className="design-details" id="details" aria-labelledby="details-title">
        <div className="details-intro"><p className="eyebrow">LUCENT P / 01 — CONCEPT EDITION</p><h2 id="details-title">Thoughtfully imagined.<br/>Openly shared.</h2><p className="body-copy">An independent exploration of portable cinema, industrial form, and the way light changes a space.</p></div>
        <dl className="spec-list"><div><dt>Object</dt><dd>Portable cinema projector</dd></div><div><dt>Material study</dt><dd>Aluminum, glass, soft-touch base</dd></div><div><dt>Expressions</dt><dd>Obsidian / Lunar / Ember</dd></div><div><dt>Interaction</dt><dd>Physical dial + optical focus ring</dd></div><div><dt>Status</dt><dd>Fictional design concept</dd></div></dl>
        <div className="details-bottom"><a className="text-link" href={`${import.meta.env.BASE_URL}lucent-concept.txt`} download>Download the concept sheet <Arrow diagonal/></a><p>This is a design study, not a product for sale.<br/>Imagined for the joy of cinema.</p></div>
      </section>
    </main>
    <footer><a className="brand footer-brand" href="#top">LUCENT<span aria-hidden="true">✳</span></a><p>A world beyond the frame.</p><div><a href="https://github.com/seoshiro/lucent-cinema" target="_blank" rel="noreferrer">Source <Arrow diagonal/></a><a href="#top">Back to the light <Arrow diagonal/></a></div><span>INDEPENDENT CONCEPT / 2026</span></footer>
    <button className="motion-toggle" type="button" onClick={() => setMotionEnabled(value => !value)}><svg aria-hidden="true" focusable="false" width="12" height="14" viewBox="0 0 12 14">{motionEnabled ? <path d="M3 1v12M9 1v12" fill="none" stroke="currentColor" strokeWidth="2"/> : <path d="m2 1 9 6-9 6Z" fill="currentColor"/>}</svg><span>{motionEnabled ? 'Pause motion' : 'Enable motion'}</span></button>
  </>
}
