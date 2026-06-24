/* Marketing pricing page. Exposes MktPricing to window. */
const NS_PRICE = window.XLabTracksDesignSystem_8f3d24;

const PLANS = [
  { name: 'Audit', price: '$0', unit: 'forever', desc: 'Read every lesson at your own pace.', cta: 'Start auditing', variant: 'secondary', featured: false,
    features: ['All 6 tracks, all lessons', 'Exercises & reading lists', 'Community forum', 'No certificate'] },
  { name: 'Member', price: '$29', unit: 'per month', desc: 'Cohorts, feedback, and a certificate.', cta: 'Join a cohort', variant: 'primary', featured: true,
    features: ['Everything in Audit', 'Weekly live cohort', 'Mentor feedback on work', 'Certificate of completion', 'Cancel anytime'] },
  { name: 'Teams', price: 'Custom', unit: 'per seat', desc: 'Train your org on AI safety together.', cta: 'Talk to us', variant: 'secondary', featured: false,
    features: ['Everything in Member', 'Private cohorts', 'Progress dashboard', 'Invoicing & SSO', 'Dedicated mentor'] },
];

function MktPricing() {
  const { Button, Badge, Card } = NS_PRICE;
  return (
    <main style={{ maxWidth: 1080, margin: '0 auto', padding: '64px 40px 72px' }}>
      <div style={{ textAlign: 'center', marginBottom: 44 }}>
        <Badge>Pricing</Badge>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 44, lineHeight: 1.08, color: 'var(--text-primary)', margin: '18px 0 12px' }}>
          Free to learn. Pay to go deeper.
        </h1>
        <p style={{ fontSize: 17, lineHeight: 1.7, color: 'var(--text-secondary)', maxWidth: '46ch', margin: '0 auto' }}>
          Every lesson is free to read. A membership adds the parts that actually change how you work — people, feedback, and accountability.
        </p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18, alignItems: 'start' }}>
        {PLANS.map((p) => (
          <Card key={p.name} pad="lg"
            style={{
              display: 'flex', flexDirection: 'column', gap: 16,
              border: p.featured ? '0.5px solid var(--accent)' : '0.5px solid var(--border-default)',
              background: p.featured ? 'var(--surface-warm)' : 'var(--surface-card)',
              position: 'relative',
            }}>
            {p.featured && (
              <span style={{ position: 'absolute', top: -11, left: 24 }}><Badge variant="accent">Most popular</Badge></span>
            )}
            <div>
              <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 4px' }}>{p.name}</p>
              <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', margin: 0 }}>{p.desc}</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 40, color: 'var(--text-primary)' }}>{p.price}</span>
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{p.unit}</span>
            </div>
            <Button variant={p.variant} style={{ width: '100%' }}>{p.cta}</Button>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
              {p.features.map((f) => (
                <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13.5, color: 'var(--text-secondary)' }}>
                  <i className="ti ti-check" style={{ fontSize: 16, color: 'var(--accent)' }} aria-hidden="true" />
                  {f}
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </main>
  );
}

Object.assign(window, { MktPricing });
