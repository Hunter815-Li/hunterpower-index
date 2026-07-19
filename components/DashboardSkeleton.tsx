export function DashboardSkeleton() {
  return <main className="site-shell skeleton-shell" aria-busy="true" aria-label="行情数据加载中">
    <div className="skeleton skeleton-header" />
    <div className="skeleton-grid"><div className="skeleton skeleton-hero" /><div className="skeleton-metrics">{Array.from({ length: 4 }).map((_, index) => <div className="skeleton" key={index} />)}</div></div>
    <div className="skeleton skeleton-chart" />
    <div className="skeleton skeleton-table" />
  </main>;
}
