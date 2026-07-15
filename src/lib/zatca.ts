// ZATCA Phase 2 QR Code — TLV encoding
// Each field: 1 byte tag + 1 byte length + N bytes value (UTF-8)

function encodeTlv(tag: number, value: string): Buffer {
  const valueBytes = Buffer.from(value, 'utf-8')
  const tagByte = Buffer.from([tag])
  const lengthByte = Buffer.from([valueBytes.length])
  return Buffer.concat([tagByte, lengthByte, valueBytes])
}

export function generateZatcaQrCode(params: {
  sellerName: string
  vatNumber: string
  timestamp: string   // ISO string
  totalWithVat: string
  vatAmount: string
}): string {
  const tlv = Buffer.concat([
    encodeTlv(1, params.sellerName),
    encodeTlv(2, params.vatNumber),
    encodeTlv(3, params.timestamp),
    encodeTlv(4, params.totalWithVat),
    encodeTlv(5, params.vatAmount),
  ])
  return tlv.toString('base64')
}

export function calculateVat(amount: number): { base: number; vat: number; total: number } {
  const vat = Math.round(amount * 0.15 * 100) / 100
  return { base: amount, vat, total: Math.round((amount + vat) * 100) / 100 }
}
