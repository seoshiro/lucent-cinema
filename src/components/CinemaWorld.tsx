import { memo, useState } from 'react'

type Props = { scene: 'aurora' | 'dune' | 'orbit'; artworkEnabled: boolean }

const CinemaWorld = memo(function CinemaWorld({ scene, artworkEnabled }: Props) {
  const [artworkStatus, setArtworkStatus] = useState<'loading' | 'ready' | 'fallback'>('loading')

  return <div className={`cinema-world cinema-world--${scene}`} data-artwork-status={scene === 'aurora' ? artworkStatus : 'procedural'} aria-hidden="true">
    <svg className="world-art" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="sky-blue" x2="0" y2="1"><stop stopColor="#020816"/><stop offset=".5" stopColor="#0d2647"/><stop offset="1" stopColor="#4d879c"/></linearGradient>
        <linearGradient id="sky-dune" x2="0" y2="1"><stop stopColor="#1b1020"/><stop offset=".6" stopColor="#b36d63"/><stop offset="1" stopColor="#f4b984"/></linearGradient>
        <linearGradient id="sky-orbit" x2="1" y2="1"><stop stopColor="#03040e"/><stop offset="1" stopColor="#122c4a"/></linearGradient>
        <linearGradient id="sea" x2="0" y2="1"><stop stopColor="#5f9fb8"/><stop offset=".2" stopColor="#1c4c6a"/><stop offset="1" stopColor="#030c1d"/></linearGradient>
        <linearGradient id="peak" x1=".2" y1="0" x2=".7" y2="1"><stop stopColor="#b5ced8"/><stop offset=".4" stopColor="#3c6882"/><stop offset="1" stopColor="#05182d"/></linearGradient>
        <linearGradient id="sand" x2=".7" y2="1"><stop stopColor="#f8caa0"/><stop offset=".3" stopColor="#a86c5b"/><stop offset="1" stopColor="#211b28"/></linearGradient>
        <radialGradient id="planet"><stop stopColor="#b9c8e1"/><stop offset=".55" stopColor="#47658b"/><stop offset=".85" stopColor="#122337"/><stop offset="1" stopColor="#020712"/></radialGradient>
        <radialGradient id="sky-glow"><stop stopColor="#95d9ff" stopOpacity=".5"/><stop offset="1" stopColor="#4c9ece" stopOpacity="0"/></radialGradient>
        <radialGradient id="sun"><stop stopColor="#fff3d8"/><stop offset=".7" stopColor="#e4b9a0"/><stop offset="1" stopColor="#ebae93" stopOpacity="0"/></radialGradient>
        <filter id="soft"><feGaussianBlur stdDeviation="24"/></filter>
      </defs>
      {scene === 'aurora' ? <>
        <rect width="1600" height="1000" fill="url(#sky-blue)"/>
        <path d="M0 600C300 560 350 410 600 510S1200 480 1600 560V1000H0Z" fill="#35556d" className="world-distant"/>
        <path d="M0 710C300 630 360 490 650 660S1300 590 1600 720V1000H0Z" fill="#1a354f" className="world-mid"/>
        <path d="M0 830C310 700 440 820 680 870S1300 710 1600 820V1000H0Z" fill="#091d32" className="world-near"/>
      </> : scene === 'dune' ? <>
        <rect width="1600" height="1000" fill="url(#sky-dune)"/>
        <circle cx="1050" cy="350" r="120" fill="url(#sun)" className="world-distant"/>
        <path d="M0 690Q300 460 720 645T1600 550V1000H0Z" fill="#6c4651" className="world-distant"/>
        <path d="M0 1000V740Q480 380 950 680T1600 670V1000Z" fill="url(#sand)" className="world-mid"/>
        <path d="M0 1000V850Q400 680 660 800T1600 710V1000Z" fill="#4c3440" className="world-near"/>
        <path d="M890 730V455h180v275h-34V490H925v240Z" fill="#202433"/>
        <path d="m925 730 111-2 240 272H900Z" fill="#fbc6a0" opacity=".12"/>
      </> : <>
        <rect width="1600" height="1000" fill="url(#sky-orbit)"/>
        <ellipse cx="1030" cy="460" rx="520" ry="420" fill="url(#sky-glow)" opacity=".35"/>
        <g className="world-distant"><circle cx="1040" cy="400" r="236" fill="url(#planet)"/>
          <ellipse cx="1040" cy="400" rx="400" ry="64" fill="none" stroke="#769bbd" strokeWidth="26" opacity=".4" transform="rotate(-24 1040 400)"/>
          <ellipse cx="1040" cy="400" rx="430" ry="73" fill="none" stroke="#9cadcc" strokeWidth="2" opacity=".55" transform="rotate(-24 1040 400)"/>
        </g>
        <path d="M0 1000V800L210 690 470 750 650 702 800 860 1000 810 1210 900 1460 750 1600 820V1000Z" fill="#0d1728" className="world-mid"/>
        <path d="M0 1000v-80l230-110 260 190h280l450-130 380 60v70Z" fill="#02060e" className="world-near"/>
      </>}
      {scene !== 'aurora' && <g fill="#e2edff" opacity=".7">{Array.from({ length: 45 }, (_, i) => <circle key={i} cx={(i * 193 + 79) % 1600} cy={(i * 137 + 40) % 450} r={i % 7 === 0 ? 1.8 : .7}/>)}</g>}
    </svg>
    {scene === 'aurora' && artworkEnabled && artworkStatus !== 'fallback' && <picture className={`world-photo ${artworkStatus === 'ready' ? 'world-photo--ready' : ''}`}>
      <img src={`${import.meta.env.BASE_URL}cinema/lucent-clear-horizon.svg`} alt="" width="2400" height="1400" decoding="async" fetchPriority="low" onLoad={() => setArtworkStatus('ready')} onError={() => setArtworkStatus('fallback')}/>
    </picture>}
    <div className="world-vignette"/>
  </div>
})

export default CinemaWorld
