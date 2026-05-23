import 'server-only'
import QRCode from 'qrcode'

export async function buildTotpQrDataUrl(uri: string): Promise<string> {
  return QRCode.toDataURL(uri, {
    errorCorrectionLevel: 'M',
    margin: 1,
    width: 220,
    color: { dark: '#000000', light: '#ffffff' },
  })
}
