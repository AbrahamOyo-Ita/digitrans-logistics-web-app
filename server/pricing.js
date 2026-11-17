import db from './db.js';

export function haversineKm(lat1, lng1, lat2, lng2) {
  if ([lat1,lng1,lat2,lng2].some(v => v == null || isNaN(v))) return null;
  const R = 6371;
  const dLat = (lat2-lat1)*Math.PI/180, dLng=(lng2-lng1)*Math.PI/180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
  return R*2*Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

export async function getActivePricing() {
  return await db.prepare(`SELECT * FROM pricing_versions ORDER BY created_at DESC LIMIT 1`).get();
}

export async function calculateDeliveryFee(
  { pickupLat, pickupLng, dropoffLat, dropoffLng, timing, isStudent, isVendor, zone }
) {
  const pricing = await getActivePricing();
  if (!pricing) throw new Error('No pricing configured');
  // Validate zone
  if (zone) {
    const z = await db.prepare(`SELECT * FROM service_zones WHERE name=? AND active=1`).get(zone);
    if (!z) throw new Error('Unsupported service area');
  }
  let distanceKm = haversineKm(pickupLat, pickupLng, dropoffLat, dropoffLng);
  let distanceMethod = 'haversine';
  if (distanceKm == null) {
    distanceKm = 3.0; // fallback estimate for Calabar intra-city when coords unavailable
    distanceMethod = 'estimate_default_3km';
  }
  distanceKm = Math.round(distanceKm*100)/100;
  let fee = pricing.base_fee + Math.round(distanceKm * pricing.per_km);
  let surcharges = 0;
  if (timing === 'scheduled') surcharges += pricing.scheduled_surcharge || 0;
  surcharges += pricing.special_charge || 0;
  fee += surcharges;
  let discount = 0;
  if (isStudent && pricing.student_flat) {
    fee = pricing.student_flat;
    discount = 0;
  } else if (isVendor && pricing.vendor_discount_pct) {
    discount = Math.round(fee * pricing.vendor_discount_pct / 100);
    fee -= discount;
  }
  if (fee < pricing.min_fee && !(isStudent && pricing.student_flat)) fee = pricing.min_fee;
  const breakdown = {
    base_fee: pricing.base_fee,
    distance_km: distanceKm,
    distance_method: distanceMethod,
    per_km: pricing.per_km,
    distance_charge: Math.round(distanceKm * pricing.per_km),
    surcharges,
    discount,
    min_fee: pricing.min_fee,
    pricing_version: pricing.version,
    pricing_version_id: pricing.id,
  };
  return { fee, distanceKm, breakdown, pricing };
}

export async function calculateWaybillFee({ origin, destination, weight, category }) {
  const band = weight < 5 ? 'below_5kg' : weight <= 10 ? '5_10kg' : 'above_10kg';
  const row = await db.prepare(`SELECT * FROM waybill_pricing WHERE origin=? AND destination=? AND weight_band=? LIMIT 1`).get(origin, destination, band);
  if (!row) throw new Error('No waybill pricing for route');
  return { fee: row.price, band, pricing: row };
}

export function calculateRiderEarnings(eligibleFee, commissionPct) {
  const rider = Math.round(eligibleFee * commissionPct / 100);
  return { riderEarnings: rider, digitransShare: eligibleFee - rider };
}
