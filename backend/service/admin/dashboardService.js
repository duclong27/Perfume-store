import { sequelize } from "../../config/sequelize.js";
import { QueryTypes } from "sequelize";


export async function getSummaryLast7DaysService() {
  const tz = "+07:00"; // VN timezone
  // Lấy ngày hiện tại (UTC) rồi lùi 6 ngày để filter
  const [fromRow] = await sequelize.query(
    "SELECT DATE(CONVERT_TZ(UTC_TIMESTAMP(), '+00:00', :tz)) - INTERVAL 6 DAY as fromDate, DATE(CONVERT_TZ(UTC_TIMESTAMP(), '+00:00', :tz)) as toDate",
    { replacements: { tz }, type: QueryTypes.SELECT }
  );
  const from = fromRow.fromDate;
  const to = fromRow.toDate;

  // Revenue & Orders (đơn hợp lệ + đã paid)
  const [main] = await sequelize.query(
    `
    SELECT 
      COUNT(*) AS orders,
      COALESCE(SUM(total_amount),0) AS revenue
    FROM orders
    WHERE status IN ('confirmed','shipped','completed')
      AND payment_status = 'paid'
      AND CONVERT_TZ(created_at, '+00:00', :tz) BETWEEN :from AND CONCAT(:to, ' 23:59:59')
    `,
    { replacements: { tz, from, to }, type: QueryTypes.SELECT }
  );

  // Cancelled / All orders
  const [cancelBlock] = await sequelize.query(
    `
    SELECT 
      COUNT(*) AS all_orders,
      SUM(CASE WHEN status='cancelled' THEN 1 ELSE 0 END) AS cancelled_orders
    FROM orders
    WHERE CONVERT_TZ(created_at, '+00:00', :tz) BETWEEN :from AND CONCAT(:to, ' 23:59:59')
    `,
    { replacements: { tz, from, to }, type: QueryTypes.SELECT }
  );

  // New customers (role=customer)
  const [newCustomersBlock] = await sequelize.query(
    `
    SELECT COUNT(DISTINCT u.user_id) AS new_customers
    FROM users u
    JOIN user_roles ur ON ur.user_id = u.user_id
    JOIN roles r ON r.role_id = ur.role_id
    WHERE LOWER(r.role_name)='customer'
      AND CONVERT_TZ(u.created_at, '+00:00', :tz) BETWEEN :from AND CONCAT(:to, ' 23:59:59')
    `,
    { replacements: { tz, from, to }, type: QueryTypes.SELECT }
  );

  // Returning orders
  const [returningBlock] = await sequelize.query(
    `
    SELECT COUNT(*) AS returning_orders
    FROM orders o
    WHERE o.status IN ('confirmed','shipped','completed')
      AND o.payment_status = 'paid'
      AND CONVERT_TZ(o.created_at, '+00:00', :tz) BETWEEN :from AND CONCAT(:to, ' 23:59:59')
      AND EXISTS (
        SELECT 1 FROM orders p
        WHERE p.user_id = o.user_id
          AND p.status IN ('confirmed','shipped','completed')
          AND p.payment_status = 'paid'
          AND CONVERT_TZ(p.created_at, '+00:00', :tz) < :from
      )
    `,
    { replacements: { tz, from, to }, type: QueryTypes.SELECT }
  );

  const orders = Number(main.orders || 0);
  const revenue = Number(main.revenue || 0);
  const aov = orders > 0 ? Math.round(revenue / orders) : 0;

  const allOrders = Number(cancelBlock.all_orders || 0);
  const cancelled = Number(cancelBlock.cancelled_orders || 0);
  const cancelRate = allOrders > 0 ? cancelled / allOrders : 0;

  const newCustomers = Number(newCustomersBlock.new_customers || 0);
  const returningOrders = Number(returningBlock.returning_orders || 0);
  const returningRate = orders > 0 ? returningOrders / orders : 0;

  return {
    range: "last_7d",
    currency: "VND",
    revenue,
    orders,
    aov,
    cancelRate,
    newCustomers,
    returningRate,
  };
}


export async function getSalesTrendService({ from, to, tz = "+07:00", groupBy = "day" }) {
  const timeStart = `${from} 00:00:00`;
  const timeEnd = `${to} 23:59:59`;

  let dateExpr = "";
  if (groupBy === "day") {
    dateExpr = "DATE(CONVERT_TZ(created_at, '+00:00', :tz))";
  } else if (groupBy === "week") {
    dateExpr = "YEARWEEK(CONVERT_TZ(created_at, '+00:00', :tz), 1)";
  } else if (groupBy === "month") {
    dateExpr = "DATE_FORMAT(CONVERT_TZ(created_at, '+00:00', :tz), '%Y-%m')";
  } else {
    throw new Error("Invalid groupBy");
  }

  const points = await sequelize.query(
    `
    SELECT 
      ${dateExpr} AS bucket,
      COALESCE(SUM(total_amount),0) AS revenue,
      COUNT(order_id) AS orders
    FROM orders
    WHERE status IN ('confirmed','shipped','completed')
      AND payment_status = 'paid'
      AND CONVERT_TZ(created_at, '+00:00', :tz) BETWEEN :timeStart AND :timeEnd
    GROUP BY bucket
    ORDER BY bucket ASC
    `,
    { replacements: { tz, timeStart, timeEnd }, type: QueryTypes.SELECT }
  );

  return {
    groupBy,
    points: points.map(p => ({
      date: String(p.bucket),
      revenue: Number(p.revenue),
      orders: Number(p.orders),
    })),
  };
}




export async function getPaymentMixService({ from, to, tz = "+07:00" }) {
  const timeStart = `${from} 00:00:00`;
  const timeEnd = `${to} 23:59:59`;

  const rows = await sequelize.query(
    `
    SELECT 
      payment_method_code,
      COALESCE(SUM(total_amount),0) AS total
    FROM orders
    WHERE status IN ('confirmed','shipped','completed')
      AND payment_status = 'paid'
      AND CONVERT_TZ(created_at, '+00:00', :tz)
        BETWEEN :timeStart AND :timeEnd
    GROUP BY payment_method_code
    `,
    { replacements: { tz, timeStart, timeEnd }, type: QueryTypes.SELECT }
  );

  const totalAll = rows.reduce((sum, r) => sum + Number(r.total || 0), 0);

  const mix = {
    cod: 0,
    bank_transfer: 0,
    vnpay: 0,
  };

  if (totalAll > 0) {
    rows.forEach((r) => {
      const code = (r.payment_method_code || "").toUpperCase();
      const val = Number(r.total || 0) / totalAll;

      if (code === "COD") {
        mix.cod = val;
      } else if (code === "BANK_TRANSFER") {
        mix.bank_transfer = val;
      } else if (code === "VNPAY") {
        mix.vnpay = val;
      }
    });
  }

  return mix;
}


export async function getOrderFunnelService({ from, to, tz = "+07:00" }) {
  const timeStart = `${from} 00:00:00`;
  const timeEnd = `${to} 23:59:59`;

  const rows = await sequelize.query(
    `
    SELECT 
      status,
      COUNT(*) AS cnt
    FROM orders
    WHERE CONVERT_TZ(created_at, '+00:00', :tz)
      BETWEEN :timeStart AND :timeEnd
    GROUP BY status
    `,
    { replacements: { tz, timeStart, timeEnd }, type: QueryTypes.SELECT }
  );

  // Chuẩn hoá output
  const funnel = {
    pending: 0,
    confirmed: 0,
    shipped: 0,
    completed: 0,
    cancelled: 0,
  };

  rows.forEach((r) => {
    const status = (r.status || "").toLowerCase();
    if (funnel.hasOwnProperty(status)) {
      funnel[status] = Number(r.cnt || 0);
    }
  });

  return funnel;
}




/**
 * Top Products/Variants trong khoảng thời gian (đã resolve from/to ở router)
 *
 * @param {Object} opts
 * @param {string} opts.from   YYYY-MM-DD  (inclusive)
 * @param {string} opts.to     YYYY-MM-DD  (inclusive)
 * @param {string} [opts.tz='+07:00']  // VN timezone cho CONVERT_TZ
 * @param {'variant'|'product'} [opts.group='variant']  // nhóm theo biến thể hay sản phẩm
 * @param {'quantity'|'revenue'} [opts.by='quantity']   // sắp xếp theo số lượng hay doanh thu
 * @param {number} [opts.limit=10]                      // số dòng tối đa
 * @param {boolean} [opts.onlyEnabledProducts=true]     // chỉ tính products.is_enable=1
 * @returns {{ rows: Array<{ variantId?:number, productId?:number, sku:string|null, name:string|null, imageUrl:string|null, brand?:string|null, soldQty:number, revenue:number }> }}
 */
export async function getTopProductsService({
  from,
  to,
  tz = "+07:00",
  group = "variant",
  by = "quantity",
  limit = 10,
  onlyEnabledProducts = true,
}) {
  if (!from || !to) throw new Error("from/to are required (YYYY-MM-DD)");
  const timeStart = `${from} 00:00:00`;
  const timeEnd = `${to} 23:59:59`;

  const isVariant = group === "variant";
  const orderBy = by === "revenue" ? "revenue DESC" : "soldQty DESC";
  const safeLimit = Math.max(1, Math.min(Number(limit) || 10, 100)); // chặn 1..100

  // SELECT fields — dùng MIN() cho field mô tả để an toàn với ONLY_FULL_GROUP_BY
  // (id là group key, các field mô tả lấy đại diện ổn định)
  const idSelect = isVariant ? "oi.variant_id AS id" : "oi.product_id AS id";
  const skuSelect = isVariant ? "MIN(v.sku) AS sku" : "NULL AS sku";
  const imgSelect = isVariant
    ? "COALESCE(MIN(v.image_url), MIN(p.image_url)) AS imageUrl"
    : "MIN(p.image_url) AS imageUrl";
  const nameSelect = isVariant
    ? `MIN(
         CONCAT(
           COALESCE(p.name,''),
           CASE WHEN v.capacity_ml IS NOT NULL THEN CONCAT(' — ', v.capacity_ml, 'ml') ELSE '' END
         )
       ) AS name`
    : "MIN(p.name) AS name";
  const brandSelect = "MIN(p.brand) AS brand";

  // Điều kiện product enable (nếu bạn muốn loại sản phẩm đã tắt)
  const enabledCond = onlyEnabledProducts ? "AND p.is_enable = 1" : "";

  // SQL chính
  const sql = `
    SELECT
      ${idSelect},
      ${skuSelect},
      ${nameSelect},
      ${imgSelect},
      ${brandSelect},
      SUM(oi.quantity) AS soldQty,
      SUM(oi.quantity * oi.price) AS revenue
    FROM order_items oi
    JOIN orders o                ON o.order_id = oi.order_id
    LEFT JOIN product_variants v ON v.variant_id = oi.variant_id
    LEFT JOIN products p         ON p.product_id = oi.product_id
    WHERE o.status IN ('confirmed','shipped','completed')
      AND o.payment_status = 'paid'
      AND CONVERT_TZ(o.created_at, '+00:00', :tz) BETWEEN :timeStart AND :timeEnd
      ${enabledCond}
    GROUP BY id
    ORDER BY ${orderBy}, id ASC
    LIMIT :limit
  `;

  const rows = await sequelize.query(sql, {
    replacements: { tz, timeStart, timeEnd, limit: safeLimit },
    type: QueryTypes.SELECT,
  });

  // Chuẩn hoá DTO cho FE
  const mapped = rows.map(r => ({
    ...(isVariant ? { variantId: Number(r.id) } : { productId: Number(r.id) }),
    sku: r.sku ?? null,
    name: r.name ?? null,
    imageUrl: r.imageUrl ?? null,
    brand: r.brand ?? null,
    soldQty: Number(r.soldQty || 0),
    revenue: Number(r.revenue || 0),
  }));

  return { rows: mapped };
}