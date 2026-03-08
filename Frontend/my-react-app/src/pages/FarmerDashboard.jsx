import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLang, useAuth } from '../context/AppContext'
import { fetchMandiPrices } from '../api/mandi'
import { sendChatMessage } from '../api/chat'
import { fetchTransportListings, createTransportListing } from '../api/transport'
import { fetchCommunityFeed, likePost, createCommunityPost } from '../api/community'
import s from './FarmerDashboard.module.css'

/* ─── Static Fallback Data ────────────────────────────────────── */
const CROPS = [
  {
    id: 'wheat', emoji: '🌾', name: 'Wheat', season: 'Rabi',
    timeline: [{ label: 'Sowing', days: 'Day 0', icon: '🌱', done: true }, { label: 'Germination', days: 'Day 7–10', icon: '🌿', done: true }, { label: 'Tillering', days: 'Day 25–45', icon: '🌾', done: true }, { label: 'Jointing', days: 'Day 50–65', icon: '🌿', done: false }, { label: 'Flowering', days: 'Day 70–85', icon: '🌸', done: false }, { label: 'Grain Fill', days: 'Day 90–110', icon: '🌾', done: false }, { label: 'Harvest', days: 'Day 120', icon: '🚜', done: false }],
    fertilizer: [{ stage: 'Basal (Sowing)', fert: 'DAP + MOP', dose: '25+10', method: 'Soil mix' }, { stage: 'Tillering (Day 25)', fert: 'Urea', dose: '20', method: 'Top dress' }, { stage: 'Jointing (Day 55)', fert: 'Urea', dose: '20', method: 'Top dress' }, { stage: 'Flowering', fert: 'Potassium Nitrate', dose: '5 foliar', method: 'Spray' }],
    pests: [{ icon: '🦟', name: 'Aphids (Mahu)', symptom: 'Yellowing leaves, sticky honeydew on shoots', remedy: 'Spray Imidacloprid 17.8% SL @ 0.5 ml/L. Neem oil as organic option.' }, { icon: '🍄', name: 'Yellow Rust', symptom: 'Yellow stripe pustules on leaves, severe yield loss', remedy: 'Spray Propiconazole 25% EC @ 1 ml/L at first sign. Variety: HD-2781.' }, { icon: '🐌', name: 'Termites (Deemak)', symptom: 'Wilting, hollow stems, roots eaten at soil level', remedy: 'Chlorpyrifos 20 EC @ 5 ml/kg seed treatment before sowing.' }]
  },
  {
    id: 'rice', emoji: '🍚', name: 'Rice', season: 'Kharif',
    timeline: [{ label: 'Nursery', days: 'Day 0–25', icon: '🌱', done: false }, { label: 'Transplant', days: 'Day 25–30', icon: '🌿', done: false }, { label: 'Tillering', days: 'Day 30–60', icon: '🌿', done: false }, { label: 'Flowering', days: 'Day 90–110', icon: '🌸', done: false }, { label: 'Harvest', days: 'Day 140', icon: '🚜', done: false }],
    fertilizer: [{ stage: 'Basal', fert: 'DAP', dose: '20 kg/acre', method: 'Broadcast' }, { stage: 'Tillering', fert: 'Urea', dose: '25 kg/acre', method: 'Top dress' }],
    pests: [{ icon: '🐛', name: 'Stem Borer', symptom: 'Dead heart, white ear, entry hole on stem', remedy: 'Chlorpyrifos 20 EC @ 2.5 ml/L or Carbofuran 3G @ 6 kg/acre.' }]
  },
  {
    id: 'onion', emoji: '🧅', name: 'Onion', season: 'Rabi/Kharif',
    timeline: [{ label: 'Nursery', days: 'Day 0–35', icon: '🌱', done: false }, { label: 'Transplant', days: 'Day 35–40', icon: '🌿', done: false }, { label: 'Vegetative', days: 'Day 40–80', icon: '🌿', done: false }, { label: 'Bulbing', days: 'Day 80–110', icon: '🧅', done: false }, { label: 'Harvest', days: 'Day 120', icon: '🚜', done: false }],
    fertilizer: [{ stage: 'Basal', fert: 'FYM + DAP', dose: '4T + 20 kg', method: 'Soil mix' }, { stage: 'Vegetative', fert: 'Urea', dose: '15 kg/acre', method: 'Top dress' }],
    pests: [{ icon: '🦟', name: 'Thrips', symptom: 'Silver streaks on leaves, curling', remedy: 'Spinosad 45 SC @ 0.3 ml/L. Avoid overhead irrigation.' }]
  },
  {
    id: 'tomato', emoji: '🍅', name: 'Tomato', season: 'All Season',
    timeline: [{ label: 'Seedling', days: 'Day 0–30', icon: '🌱', done: false }, { label: 'Vegetative', days: 'Day 30–50', icon: '🌿', done: false }, { label: 'Flowering', days: 'Day 50–60', icon: '🌸', done: false }, { label: 'Fruit Set', days: 'Day 60–75', icon: '🍅', done: false }, { label: 'Harvest', days: 'Day 75–90', icon: '🚜', done: false }],
    fertilizer: [{ stage: 'Transplanting', fert: 'DAP', dose: '25 kg/acre', method: 'Basal' }, { stage: 'Fruit Set', fert: 'Potassium Sulfate', dose: '10 kg/acre', method: 'Drip' }],
    pests: [{ icon: '🟤', name: 'Blossom End Rot', symptom: 'Dark sunken spot at fruit bottom', remedy: 'Calcium foliar spray @ 0.5%. Maintain consistent irrigation.' }]
  },
  {
    id: 'soybean', emoji: '🫘', name: 'Soybean', season: 'Kharif',
    timeline: [{ label: 'Germination', days: 'Day 0–7', icon: '🌱', done: false }, { label: 'Vegetative', days: 'Day 7–35', icon: '🌿', done: false }, { label: 'Flowering', days: 'Day 35–55', icon: '🌸', done: false }, { label: 'Pod Fill', days: 'Day 55–80', icon: '🫘', done: false }, { label: 'Maturity', days: 'Day 85–95', icon: '🚜', done: false }],
    fertilizer: [{ stage: 'Basal', fert: 'Rhizobium + PSB', dose: 'Seed treatment', method: 'Inoculation' }, { stage: 'Vegetative', fert: 'DAP', dose: '20 kg/acre', method: 'Broadcast' }],
    pests: [{ icon: '🐛', name: 'Girdle Beetle', symptom: 'Two girdling rings on stem, plants snap off', remedy: 'Quinalphos 25 EC @ 2 ml/L spray at early vegetative stage.' }]
  },
]

const STATIC_MANDI = [
  { emoji: '🧅', name: 'Onion', market: 'Nashik APMC', modal_price: 2750, delta: '▲ +₹180', up: true },
  { emoji: '🌾', name: 'Wheat', market: 'Nashik APMC', modal_price: 2275, delta: '▲ +₹25', up: true },
  { emoji: '🍅', name: 'Tomato', market: 'Nashik APMC', modal_price: 1200, delta: '▼ -₹320', up: false, down: true },
  { emoji: '🫘', name: 'Soybean', market: 'Nashik APMC', modal_price: 4100, delta: '→ Stable', up: false },
  { emoji: '🌽', name: 'Maize', market: 'Nashik APMC', modal_price: 1890, delta: '▲ +₹90', up: true },
]

const CROP_EMOJI = { wheat: '🌾', rice: '🍚', onion: '🧅', tomato: '🍅', soybean: '🫘', maize: '🌽', cotton: '🌸', potato: '🥔' }
const STATIC_BOT_REPLIES = {
  '🌧️ Rain forecast?': 'IMD forecast for Nashik: Light to moderate rain on March 10–11. Avoid pesticide spraying 24 hrs before rain.',
  '💰 MSP rates?': 'MSP 2025–26: Wheat ₹2,275/q | Paddy ₹2,300/q | Soybean ₹4,892/q | Maize ₹2,225/q | Cotton ₹7,121/q.',
  '🌱 Sowing tips': 'Best Rabi sowing time: Wheat (Oct 15–Nov 15), Onion (Oct–Nov). Ensure soil moisture >50%. Use certified seeds from KVK.',
  '🏛️ Govt schemes': 'PM Kisan (₹6,000/yr) · PM Fasal Bima Yojana · Kisan Credit Card · PMKSY drip irrigation 55% subsidy. Apply at nearest CSC.',
  '📊 Today\'s prices': 'Nashik APMC today: Onion ₹2,750 ▲ | Wheat ₹2,275 ▲ | Tomato ₹1,200 ▼ | Soybean ₹4,100 → | Maize ₹1,890 ▲.',
  '💧 Water saving': 'Drip irrigation saves 40% water. Water wheat 6–8 AM. Soil moisture sensor for precision. Mulching reduces evaporation 30%.',
}

/* ── Accordion ── */
function Accordion({ title, children, openDefault = true }) {
  const [open, setOpen] = useState(openDefault)
  return (
    <div className={s.acc}>
      <button className={s.accHead} onClick={() => setOpen(o => !o)}>
        {title}<span className={s.accArrow}>{open ? '▼' : '▶'}</span>
      </button>
      {open && <div className={s.accBody}>{children}</div>}
    </div>
  )
}

/* ── Crops Tab ── */
function CropsTab({ t }) {
  const [sel, setSel] = useState('wheat')
  const crop = CROPS.find(c => c.id === sel)
  return (
    <div>
      <h2 className={s.secTitle}>🌿 {t('tab_crops')}</h2>
      <p className={s.secSub}>Select a crop to view growth timeline, fertilizer schedule &amp; pest management</p>
      <div className={s.cropGrid}>
        {CROPS.map(c => (
          <div key={c.id} className={`${s.cropCard} ${sel === c.id ? s.cropSel : ''}`} onClick={() => setSel(c.id)}>
            <span className={s.cropEmoji}>{c.emoji}</span>
            <div className={s.cropName}>{c.name}</div>
            <div className={s.cropSeason}>{c.season}</div>
          </div>
        ))}
      </div>
      {crop && (
        <div>
          <Accordion title={`📅 Growth Timeline — ${crop.name}`}>
            <div className={s.timeline}>
              {crop.timeline.map((step, i) => (
                <div key={i} className={s.tStep}>
                  <div className={`${s.tDot} ${step.done ? s.tDone : ''}`}>{step.icon}</div>
                  <div className={s.tLabel}>{step.label}</div>
                  <div className={s.tDays}>{step.days}</div>
                </div>
              ))}
            </div>
            {sel === 'wheat' && <p className={s.tipText}>Current: <strong style={{ color: 'var(--green-mid)' }}>Day 32 — Tillering Stage</strong></p>}
          </Accordion>
          <Accordion title="🧪 Fertilizer Schedule" openDefault={sel === 'wheat'}>
            <div className={s.fertWrap}>
              <table className={s.fertTable}>
                <thead><tr><th>Stage</th><th>Fertilizer</th><th>Dose</th><th>Method</th></tr></thead>
                <tbody>{crop.fertilizer.map((r, i) => <tr key={i}><td>{r.stage}</td><td>{r.fert}</td><td>{r.dose}</td><td>{r.method}</td></tr>)}</tbody>
              </table>
            </div>
            <p className={s.tipText}>⚠️ Apply fertilizer after irrigation for best absorption.</p>
          </Accordion>
          <Accordion title="🐛 Pests &amp; Remedies" openDefault={sel === 'wheat'}>
            {crop.pests.map((p, i) => (
              <div key={i} className={s.pestCard}>
                <div className={s.pestIcon}>{p.icon}</div>
                <div>
                  <div className={s.pestName}>{p.name}</div>
                  <div className={s.pestSym}><strong>Symptom:</strong> {p.symptom}</div>
                  <div className={s.pestRem}>✅ <strong>Remedy:</strong> {p.remedy}</div>
                </div>
              </div>
            ))}
          </Accordion>
        </div>
      )}
    </div>
  )
}

/* ── Community Tab ── */
function CommunityTab({ t, userId }) {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [question, setQuestion] = useState('')
  const [photoFile, setPhotoFile] = useState(null)
  const [posting, setPosting] = useState(false)
  const [postMsg, setPostMsg] = useState('')
  const [likedIds, setLikedIds] = useState(new Set())
  const fileRef = React.useRef(null)

  const loadFeed = () => {
    fetchCommunityFeed()
      .then(setPosts)
      .catch(() => { })
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadFeed() }, [])

  const handleLike = async (postId) => {
    try {
      await likePost(postId)
      setLikedIds(prev => {
        const n = new Set(prev)
        n.has(postId) ? n.delete(postId) : n.add(postId)
        return n
      })
      setPosts(prev => prev.map(p =>
        p.id === postId
          ? { ...p, likes_count: p.likes_count + (likedIds.has(postId) ? -1 : 1) }
          : p
      ))
    } catch (e) { /* silent */ }
  }

  const handlePost = async () => {
    if (!question.trim()) { setPostMsg('⚠️ Please write something first.'); return }
    setPosting(true)
    setPostMsg('')
    try {
      await createCommunityPost(question.trim(), [], photoFile || undefined)
      setQuestion('')
      setPhotoFile(null)
      setPostMsg('✅ Post shared!')
      loadFeed()
    } catch (e) {
      setPostMsg('❌ Failed to post. Please login and try again.')
    } finally {
      setPosting(false)
    }
  }

  // Static fallback posts shown when backend is empty or loading
  const staticPosts = [
    { id: 's1', user_name: 'Suresh Wagh', caption: 'Mazi wheat crop mhanje yellow rust cha problem zala aahe. Nashik bhagaat konala he problem aahe ka? Propiconazole spray kelya nantar improvement zale mala.', tags: ['Wheat', 'Pest'], likes_count: 42, comments_count: 13, created_at: '2 hours ago' },
    { id: 's2', user_name: 'Meena Devi', caption: 'Onion prices at Lasalgaon touched ₹2,800/quintal today! Nashik region farmers — hold your stock for 2 more weeks if you have storage.', tags: ['Onion', 'Market'], likes_count: 87, comments_count: 24, created_at: '5 hours ago' },
    { id: 's3', user_name: 'Rajesh Kulkarni', caption: 'Installed drip irrigation for 3 acres of tomatoes. Water usage dropped 40% and yield up 25%. Government subsidy covered 50% of cost!', tags: ['Water', 'Irrigation'], likes_count: 156, comments_count: 38, created_at: 'Yesterday' },
  ]
  const displayPosts = loading ? [] : (posts.length > 0 ? posts : staticPosts)

  return (
    <div>
      <h2 className={s.secTitle}>👨‍👩‍👧 {t('tab_community')}</h2>
      <p className={s.secSub}>Ask questions, share experiences, and connect with farmers near you</p>
      <div className={s.commLayout}>
        <div>
          <div className={s.flexBetween} style={{ marginBottom: 16 }}>
            <strong style={{ fontSize: '.92rem', color: 'var(--text-mid)' }}>Recent Posts</strong>
          </div>
          {loading && <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-soft)' }}>Loading posts…</div>}
          {displayPosts.map((p, i) => {
            const isStatic = p.id?.startsWith('s')
            const name = p.user_name || 'Farmer'
            return (
              <div key={p.id || i} className={s.postCard}>
                <div className={s.postHeader}>
                  <div className={`${s.avatar} ${s.avgreen}`}>{name[0]}</div>
                  <div><div className={s.postAuthor}>{name}</div><div className={s.postMeta}>{typeof p.created_at === 'string' && !p.created_at.includes('T') ? p.created_at : new Date(p.created_at).toLocaleDateString()}</div></div>
                </div>
                <div style={{ marginBottom: 8 }}>{(p.tags || []).map(tg => <span key={tg} className={s.tag}>{tg}</span>)}</div>
                <div className={s.postBody}>{p.caption || p.body}</div>
                <div className={s.postActions}>
                  <button className={`${s.actBtn} ${likedIds.has(p.id) ? s.voted : ''}`}
                    onClick={() => !isStatic && handleLike(p.id)}>
                    👍 {p.likes_count + (likedIds.has(p.id) ? 1 : 0)}
                  </button>
                  <button className={s.actBtn}>💬 {p.comments_count} Comments</button>
                  <button className={s.actBtn}>🔗 Share</button>
                </div>
              </div>
            )
          })}
          <div className={s.card} style={{ marginTop: 16 }}>
            <div className={s.cardTitle}>🙋 Ask a Question</div>
            <textarea className={s.askArea} placeholder="Type your farming question here..." value={question} onChange={e => setQuestion(e.target.value)} />
            <div style={{ display: 'flex', gap: 10, marginTop: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <button className={s.btnPrimary} onClick={handlePost} disabled={posting}>
                {posting ? '⏳ Posting…' : 'Post Question'}
              </button>
              <button className={s.btnSec} onClick={() => fileRef.current?.click()}>
                {photoFile ? `📷 ${photoFile.name.slice(0, 20)}…` : 'Add Photo 📷 (optional)'}
              </button>
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }}
                onChange={e => setPhotoFile(e.target.files[0] || null)} />
            </div>
            {postMsg && <div style={{ marginTop: 8, fontSize: '.85rem', color: postMsg.startsWith('✅') ? 'var(--green-mid)' : 'var(--text-muted)' }}>{postMsg}</div>}
          </div>
        </div>
        <div>
          <div className={s.card}>
            <div className={s.cardTitle}>🔥 Trending Topics</div>
            <div className={s.divider} />
            {[['🧅', 'Onion Prices Surge', '342 farmers discussing'], ['🌧️', 'IMD Rain Forecast', '218 farmers discussing'], ['💰', 'PM Kisan 19th Installment', '891 farmers discussing'], ['🌾', 'MSP for Wheat 2026', '456 farmers discussing']].map(([ic, ti, me]) => (
              <div key={ti} className={s.trendItem}><span className={s.trendIcon}>{ic}</span><div><div className={s.trendTitle}>{ti}</div><div className={s.trendMeta}>{me}</div></div></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Mandi Tab ── */
function MandiTab({ t }) {
  const [prices, setPrices] = useState([])
  const [loading, setLoading] = useState(true)
  const [apiError, setApiError] = useState(false)

  useEffect(() => {
    fetchMandiPrices()
      .then(data => { setPrices(data); setLoading(false) })
      .catch(() => { setApiError(true); setLoading(false) })
  }, [])

  const displayPrices = apiError || prices.length === 0 ? STATIC_MANDI : prices.map(p => ({
    emoji: CROP_EMOJI[p.crop?.toLowerCase()] || '🌿',
    name: p.crop,
    market: p.market || `${p.district} APMC`,
    modal_price: p.modal_price,
    min_price: p.min_price,
    max_price: p.max_price,
    delta: '',
    up: false,
  }))

  return (
    <div>
      <h2 className={s.secTitle}>📊 {t('tab_mandi')}</h2>
      <p className={s.secSub}>
        {apiError ? 'Showing cached data · Live API key not configured' : 'Live market rates · Updated from Agmarknet'}
      </p>
      <div className={s.mandiLayout}>
        <div>
          {loading && <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-soft)' }}>Loading prices…</div>}
          {displayPrices.map((m, i) => (
            <div key={i} className={s.priceCard}>
              <div className={s.priceIcon}>{m.emoji}</div>
              <div className={s.priceInfo}><div className={s.priceName}>{m.name}</div><div className={s.priceMarket}>{m.market}</div></div>
              <div className={s.priceVal}>
                <div className={s.priceNum}>₹{m.modal_price?.toLocaleString('en-IN') || m.price}</div>
                <div className={s.priceUnit}>/quintal</div>
              </div>
              {m.delta && <span className={`${s.priceDelta} ${m.up ? s.deltaUp : m.down ? s.deltaDown : s.deltaFlat}`}>{m.delta}</span>}
            </div>
          ))}
        </div>
        <div>
          <div className={s.chartWrap}>
            <div className={s.chartTitle}>📈 Onion Price Trend</div>
            <div className={s.chartSub}>Last 7 days · Nashik APMC</div>
            <svg viewBox="0 0 280 120" className={s.chartSvg}>
              <defs><linearGradient id="ag" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#7ab648" stopOpacity=".3" /><stop offset="100%" stopColor="#7ab648" stopOpacity="0" /></linearGradient></defs>
              <line x1="0" y1="100" x2="280" y2="100" stroke="#e8d5b7" strokeWidth="1" />
              <line x1="0" y1="70" x2="280" y2="70" stroke="#e8d5b7" strokeWidth="0.5" strokeDasharray="4,3" />
              <line x1="0" y1="40" x2="280" y2="40" stroke="#e8d5b7" strokeWidth="0.5" strokeDasharray="4,3" />
              <polygon points="20,80 60,75 100,85 140,65 180,55 220,50 260,45 260,100 20,100" fill="url(#ag)" />
              <polyline points="20,80 60,75 100,85 140,65 180,55 220,50 260,45" fill="none" stroke="#4a7c2f" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
              {[[20, 80], [60, 75], [100, 85], [140, 65], [180, 55], [220, 50]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="4" fill="#fff" stroke="#4a7c2f" strokeWidth="2" />)}
              <circle cx="260" cy="45" r="5" fill="#4a7c2f" stroke="#2d5016" strokeWidth="2" />
            </svg>
          </div>
          <div className={s.card}>
            <div className={s.cardTitle}>💡 AI Market Insights</div>
            <div className={s.divider} />
            {[['📈', 'Onion prices expected to rise 8–12% next week due to lower arrivals from Rajasthan.'], ['⚠️', 'Tomato glut expected. Consider cold storage or sell within 3 days at current price.'], ['✅', 'Wheat MSP is ₹2,275/q. Current mandi matches MSP — sell now or wait for private buyers.']].map(([ic, tx]) => (
              <div key={ic} className={s.insightItem}><span className={s.insightIcon}>{ic}</span><span className={s.insightText}>{tx}</span></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Transport Tab ── */
function TransportTab({ t }) {
  const [listings, setListings] = useState([])
  const [loadingList, setLoadingList] = useState(true)
  const [booked, setBooked] = useState(null)
  const [posting, setPosting] = useState(false)

  // Form state
  const [form, setForm] = useState({
    route_from: '', route_to: '', crop_type: 'Wheat', quantity: '', vehicle_type: 'Mini Truck (1–3 Ton)', pickup_date: ''
  })

  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const loadListings = () => {
    setLoadingList(true)
    fetchTransportListings()
      .then(setListings)
      .catch(() => setListings([]))
      .finally(() => setLoadingList(false))
  }

  useEffect(loadListings, [])

  const handleFindTransporters = async () => {
    try {
      setPosting(true)
      await createTransportListing({
        route_from: form.route_from || 'Nashik',
        route_to: form.route_to || 'Nashik APMC',
        price: 800,
        capacity: form.quantity ? `${form.quantity} quintal` : '10 quintal',
        vehicle_type: form.vehicle_type,
        notes: `Crop: ${form.crop_type}${form.pickup_date ? ', Date: ' + form.pickup_date : ''}`,
      })
      await loadListings()
    } catch (e) { /* silent, user may not be authenticated */ }
    finally { setPosting(false) }
  }

  return (
    <div>
      <h2 className={s.secTitle}>🚛 {t('tab_transport')}</h2>
      <p className={s.secSub}>Book vehicles for crop transport · Track your bookings</p>
      <div className={s.tpLayout}>
        <div>
          <div className={s.card} style={{ marginBottom: 16 }}>
            <div className={s.cardTitle}>📝 New Transport Request</div>
            <p style={{ fontSize: '.8rem', color: 'var(--text-muted)', marginBottom: 14 }}>Fill details to post a transport request</p>
            <div className={s.formGrid}>
              <div className={s.formGroup}>
                <label className={s.formLabel}>From Location</label>
                <input className={s.formInput} type="text" placeholder="Village/Taluka" value={form.route_from} onChange={e => setF('route_from', e.target.value)} />
              </div>
              <div className={s.formGroup}>
                <label className={s.formLabel}>To (Mandi)</label>
                <select className={s.formInput} value={form.route_to} onChange={e => setF('route_to', e.target.value)}>
                  <option>Nashik APMC</option><option>Lasalgaon Mandi</option><option>Pune APMC</option>
                </select>
              </div>
              <div className={s.formGroup}>
                <label className={s.formLabel}>Crop Type</label>
                <select className={s.formInput} value={form.crop_type} onChange={e => setF('crop_type', e.target.value)}>
                  {['Wheat', 'Onion', 'Tomato', 'Soybean'].map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
              <div className={s.formGroup}>
                <label className={s.formLabel}>Quantity (Quintal)</label>
                <input className={s.formInput} type="number" placeholder="e.g. 10" value={form.quantity} onChange={e => setF('quantity', e.target.value)} />
              </div>
              <div className={s.formGroup}>
                <label className={s.formLabel}>Vehicle Type</label>
                <select className={s.formInput} value={form.vehicle_type} onChange={e => setF('vehicle_type', e.target.value)}>
                  {['Mini Truck (1–3 Ton)', 'Medium Truck (3–7 Ton)', 'Large Truck (7–15 Ton)'].map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
              <div className={s.formGroup}>
                <label className={s.formLabel}>Pickup Date</label>
                <input className={s.formInput} type="date" value={form.pickup_date} onChange={e => setF('pickup_date', e.target.value)} />
              </div>
            </div>
            <button className={s.btnPrimary} style={{ marginTop: 4 }} onClick={handleFindTransporters} disabled={posting}>
              {posting ? '⏳ Posting…' : '🔍 Post & Find Transporters'}
            </button>
          </div>
        </div>
        <div>
          <div className={s.cardTitle} style={{ marginBottom: 16 }}>🚛 Available Transport Listings</div>
          {loadingList && <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-soft)' }}>Loading…</div>}
          {!loadingList && listings.length === 0 && (
            <div className={s.card} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1.5rem' }}>
              No active listings yet. Be the first to post!
            </div>
          )}
          {listings.map((tr, i) => (
            <div key={tr.id || i} className={s.trCard}>
              <div className={s.trTruck}>🚛</div>
              <div className={s.trInfo}>
                <div className={s.trName}>{tr.user_name}</div>
                <div className={s.trMeta}>{tr.vehicle_type} · {tr.capacity} · {tr.route_from} → {tr.route_to}</div>
                {tr.notes && <div className={s.trRating} style={{ fontSize: '.75rem' }}>{tr.notes}</div>}
              </div>
              <div className={s.trPrice}>
                <div className={s.trRate}>₹{tr.price?.toLocaleString('en-IN')}</div>
                <div style={{ fontSize: '.72rem', color: 'var(--text-muted)' }}>/{tr.capacity}</div>
              </div>
              <button className={`${s.bookBtn} ${booked === i ? s.bookDone : ''}`}
                onClick={() => setBooked(i)}>{booked === i ? '✓ Booked' : 'Book'}</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ── Chatbot Tab ── */
function ChatbotTab({ t, userName }) {
  const [msgs, setMsgs] = useState([
    { type: 'bot', text: `Namaste ${userName} ji! 🙏 Main aapka Kisan Saathi AI hoon. Aap kuch bhi pooch sakte hain — crops, mandi prices, weather, government schemes, ya koi bhi farming sawaal!` },
  ])
  const [input, setInput] = useState('')
  const [sessionId, setSessionId] = useState(null)
  const [sending, setSending] = useState(false)
  const endRef = useRef(null)

  const now = () => { const d = new Date(); return `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')} ${d.getHours() >= 12 ? 'PM' : 'AM'}` }

  const addMsg = (text, type) => {
    setMsgs(m => [...m, { type, text, time: now() }])
    setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
  }

  const send = async (text) => {
    if (!text.trim() || sending) return
    addMsg(text, 'user')
    setInput('')
    setSending(true)
    try {
      const data = await sendChatMessage(text, sessionId)
      if (data.session_id) setSessionId(data.session_id)
      addMsg(data.reply, 'bot')
    } catch (e) {
      // Fallback to static replies if AI key not configured
      const staticReply = STATIC_BOT_REPLIES[text] || 'Main aapki baat samajh raha hoon. Nashik region ke liye specific advice ke liye apne local KVK center se bhi contact kar sakte hain.'
      addMsg(staticReply, 'bot')
    } finally {
      setSending(false)
    }
  }

  return (
    <div>
      <h2 className={s.secTitle}>🤖 {t('tab_chatbot')}</h2>
      <p className={s.secSub}>Ask anything about farming — in Hindi, Marathi, or English</p>
      <div className={s.chatContainer}>
        <div className={s.chatTopbar}>
          <div className={s.chatAvatar}>🌱</div>
          <div><div className={s.chatName}>Kisan Saathi AI</div><div className={s.chatStatus}><span className={s.onlineDot} />{sending ? 'Typing…' : 'Online · Powered by Gemini AI'}</div></div>
        </div>
        <div className={s.chatMsgs}>
          {msgs.map((m, i) => (
            <div key={i} className={`${s.msg} ${m.type === 'bot' ? s.msgBot : s.msgUser}`}>
              <div className={`${s.msgAv} ${m.type === 'bot' ? s.botAv : s.userAv}`}>{m.type === 'bot' ? '🌱' : userName[0] || 'R'}</div>
              <div>
                <div className={s.bubble}>{m.text.split('\n').map((l, j) => l ? <span key={j}>{l}<br /></span> : <br key={j} />)}</div>
                <div className={s.msgTime}>{m.time || 'Just now'}</div>
              </div>
            </div>
          ))}
          {sending && (
            <div className={`${s.msg} ${s.msgBot}`}>
              <div className={`${s.msgAv} ${s.botAv}`}>🌱</div>
              <div><div className={s.bubble} style={{ opacity: .6 }}>● ● ●</div></div>
            </div>
          )}
          <div ref={endRef} />
        </div>
        <div className={s.prompts}>
          {Object.keys(STATIC_BOT_REPLIES).map(p => <button key={p} className={s.promptChip} onClick={() => send(p)}>{p}</button>)}
        </div>
        <div className={s.chatInputRow}>
          <input className={s.chatInput} type="text" placeholder={t('type_question') || 'Type your question...'} value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && send(input)} />
          <button className={s.sendBtn} onClick={() => send(input)} disabled={sending}>➤</button>
        </div>
      </div>
    </div>
  )
}

/* ── Dashboard ── */
export default function FarmerDashboard() {
  const { t, lang, setLang } = useLang()
  const { user, logout } = useAuth()
  const nav = useNavigate()
  const [tab, setTab] = useState('crops')

  const doLogout = () => { logout(); nav('/login') }
  const firstName = user?.name?.split(' ')[0] || 'Ramesh'

  const tabs = [
    { id: 'crops', icon: '🌾', key: 'tab_crops' },
    { id: 'community', icon: '👨‍👩‍👧', key: 'tab_community' },
    { id: 'mandi', icon: '📊', key: 'tab_mandi' },
    { id: 'transport', icon: '🚛', key: 'tab_transport' },
    { id: 'chatbot', icon: '🤖', key: 'tab_chatbot' },
  ]

  return (
    <div className={s.root}>
      {/* Header */}
      <header className={s.header}>
        <div className={s.headerBrand}>
          <div className={s.headerIcon}>🌱</div>
          <div>
            <div className={s.headerName}>{t('brand_name')}</div>
            <div className={s.headerSub}>किसान का साथी</div>
          </div>
        </div>
        <div className={s.headerRight}>
          {[['EN', 'EN'], ['HI', 'हिं'], ['MR', 'मर']].map(([c, l]) => (
            <button key={c} className={`${s.langBtn} ${lang === c ? s.langActive : ''}`} onClick={() => setLang(c)}>{l}</button>
          ))}
          <div className={s.avatar}>👨‍🌾</div>
          <button className={s.logoutBtn} onClick={doLogout}>{t('logout')}</button>
        </div>
      </header>

      {/* Info bar */}
      <div className={s.infoBar}>
        <div className={s.infoItem}>{t('greeting')}, <strong>{firstName}</strong> 🙏</div>
        <div className={s.infoDivider} />
        <div className={s.infoItem}>📧 <strong>{user?.email || 'Farmer'}</strong></div>
        <div className={s.infoDivider} />
        <div className={s.infoItem}><span className={s.seasonBadge}>{t('rabi_season')}</span></div>
        <div className={s.infoDivider} />
        <div className={s.weatherPill}>🌤 Live Weather</div>
      </div>

      {/* Nav tabs */}
      <nav className={s.navTabs}>
        {tabs.map(tb => (
          <button key={tb.id} className={`${s.tabBtn} ${tab === tb.id ? s.tabActive : ''}`} onClick={() => setTab(tb.id)}>
            <span className={s.tabIcon}>{tb.icon}</span>
            <span className={s.tabLabel}>{t(tb.key)}</span>
          </button>
        ))}
      </nav>

      {/* Main */}
      <main className={s.main}>
        {tab === 'crops' && <CropsTab t={t} />}
        {tab === 'community' && <CommunityTab t={t} userId={user?.id} />}
        {tab === 'mandi' && <MandiTab t={t} />}
        {tab === 'transport' && <TransportTab t={t} />}
        {tab === 'chatbot' && <ChatbotTab t={t} userName={firstName} />}
      </main>

      <footer className={s.footer}><span>Kisan Saathi</span> · {t('footer_text')} · © 2026</footer>
    </div>
  )
}
