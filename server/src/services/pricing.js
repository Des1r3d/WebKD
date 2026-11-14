export function voucherDiscount(voucher, subtotal) {
  const amount = voucher.discount_type === 'PERCENT'
    ? Math.round((subtotal * voucher.value) / 100)
    : voucher.value;
  return Math.min(voucher.max_discount, amount);
}

export function venueDiscount(voucher, slotPrice) {
  return voucher && ['VENUE', 'CROSS'].includes(voucher.scope)
    ? voucherDiscount(voucher, slotPrice)
    : 0;
}
