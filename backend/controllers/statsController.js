const db = require('../db');

/**
 * Fetch dashboard stats and chart data for admin
 */
async function getAdminStats(req, res) {
  try {
    // 1. Core KPIs
    const kpiQuery = await db.query(`
      SELECT 
        COALESCE(SUM(CASE WHEN status IN ('paid', 'processing', 'delivered') THEN amount_ghs ELSE 0 END), 0)::float as total_revenue,
        COALESCE(SUM(CASE WHEN created_at >= CURRENT_DATE AND status IN ('paid', 'processing', 'delivered') THEN amount_ghs ELSE 0 END), 0)::float as revenue_today,
        COUNT(CASE WHEN created_at >= CURRENT_DATE THEN 1 END)::int as orders_today,
        COUNT(CASE WHEN status IN ('pending', 'paid', 'processing') THEN 1 END)::int as active_orders,
        COUNT(CASE WHEN status = 'failed' THEN 1 END)::int as failed_orders
      FROM orders
    `);

    // Calculate profit (amount_ghs - cost_price_ghs for data, airtime has 5% margin mock profit or exact difference if we add cost price)
    // For simplicity, we assume cost_price_ghs is tracked in bundles. For airtime, we assume a standard 3% wholesale margin if cost_price is not captured.
    const profitQuery = await db.query(`
      SELECT 
        COALESCE(SUM(
          CASE 
            WHEN o.order_type = 'data' AND b.cost_price_ghs IS NOT NULL THEN (o.amount_ghs - b.cost_price_ghs)
            WHEN o.order_type = 'airtime' THEN (o.amount_ghs * 0.03) -- assume 3% standard margin on airtime
            ELSE (o.amount_ghs * 0.05)
          END
        ), 0)::float as total_profit,
        COALESCE(SUM(
          CASE 
            WHEN o.created_at >= CURRENT_DATE THEN
              CASE 
                WHEN o.order_type = 'data' AND b.cost_price_ghs IS NOT NULL THEN (o.amount_ghs - b.cost_price_ghs)
                WHEN o.order_type = 'airtime' THEN (o.amount_ghs * 0.03)
                ELSE (o.amount_ghs * 0.05)
              END
            ELSE 0
          END
        ), 0)::float as profit_today
      FROM orders o
      LEFT JOIN bundles b ON o.bundle_id = b.id
      WHERE o.status IN ('paid', 'processing', 'delivered')
    `);

    // 2. Chart Data: Past 7 days sales aggregation
    const chartQuery = await db.query(`
      SELECT 
        TO_CHAR(d.day, 'YYYY-MM-DD') as date,
        COALESCE(SUM(CASE WHEN o.status IN ('paid', 'processing', 'delivered') THEN o.amount_ghs ELSE 0 END), 0)::float as revenue,
        COUNT(o.id)::int as orders,
        COALESCE(SUM(
          CASE 
            WHEN o.status IN ('paid', 'processing', 'delivered') THEN
              CASE 
                WHEN o.order_type = 'data' AND b.cost_price_ghs IS NOT NULL THEN (o.amount_ghs - b.cost_price_ghs)
                WHEN o.order_type = 'airtime' THEN (o.amount_ghs * 0.03)
                ELSE (o.amount_ghs * 0.05)
              END
            ELSE 0
          END
        ), 0)::float as profit
      FROM GENERATE_SERIES(CURRENT_DATE - INTERVAL '6 days', CURRENT_DATE, '1 day') d(day)
      LEFT JOIN orders o ON DATE(o.created_at) = DATE(d.day)
      LEFT JOIN bundles b ON o.bundle_id = b.id
      GROUP BY d.day
      ORDER BY d.day ASC
    `);

    // 3. Top Network Shares
    const networkShareQuery = await db.query(`
      SELECT 
        network_id as network,
        COUNT(*)::int as order_count,
        COALESCE(SUM(amount_ghs), 0)::float as total_amount
      FROM orders
      WHERE status IN ('paid', 'processing', 'delivered')
      GROUP BY network_id
    `);

    const stats = kpiQuery.rows[0];
    const profit = profitQuery.rows[0];

    return res.json({
      kpis: {
        totalRevenue: stats.total_revenue,
        revenueToday: stats.revenue_today,
        ordersToday: stats.orders_today,
        activeOrders: stats.active_orders,
        failedOrders: stats.failed_orders,
        totalProfit: profit.total_profit,
        profitToday: profit.profit_today
      },
      chartData: chartQuery.rows,
      networkShare: networkShareQuery.rows
    });
  } catch (error) {
    console.error('[Stats Controller] getAdminStats error:', error);
    return res.status(500).json({ error: 'Failed to aggregate administration statistics.' });
  }
}

module.exports = {
  getAdminStats
};
