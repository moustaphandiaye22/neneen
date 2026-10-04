import PDFDocument from 'pdfkit'
import { prisma } from '../../lib/prisma.js'
import { httpError } from '../../errors/httpError.js'
export async function createReceipt(userId: string, paymentId: string) {
  const payment = await prisma.payment.findFirst({
    where: { id: paymentId, userId, status: { in: ['SUCCEEDED', 'REFUND_PENDING', 'REFUNDED'] } },
    include: { booking: { include: { activity: true } }, order: { include: { items: true } } },
  })
  if (!payment) throw httpError(404, 'Reçu introuvable.')
  const document = new PDFDocument({ margin: 48 })
  const chunks: Buffer[] = []
  document.on('data', (chunk: Buffer) => chunks.push(chunk))
  const done = new Promise<Buffer>((resolve, reject) => {
    document.on('end', () => resolve(Buffer.concat(chunks)))
    document.on('error', reject)
  })
  document.fontSize(22).text('neneen — Reçu de paiement')
  document
    .moveDown()
    .fontSize(11)
    .text(`Référence : ${payment.booking?.reference ?? payment.order?.reference}`)
  document.text(`Paiement : ${payment.id}`)
  document.text(
    `Date : ${payment.updatedAt.toLocaleDateString('fr-FR', { timeZone: 'Africa/Dakar' })}`,
  )
  document.text(`Moyen : ${payment.method}`)
  document.text(`Montant : ${payment.amount.toLocaleString('fr-FR')} FCFA`)
  document.text(`État : ${payment.status}`)
  if (payment.booking)
    document
      .moveDown()
      .text(`Activité : ${payment.booking.activity.title} (${payment.booking.quantity} place(s))`)
  if (payment.order)
    for (const item of payment.order.items)
      document
        .moveDown()
        .text(
          `${item.name} · ${item.size} × ${item.quantity} : ${item.unitPrice * item.quantity} FCFA`,
        )
  document.end()
  return done
}
