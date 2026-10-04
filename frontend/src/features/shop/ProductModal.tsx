import type { Product } from '../../types'
import { money } from '../../lib/presentation'
import { stockForSize } from './stock'
import { usesCollectionImage } from '../../lib/productImages'
import { MessageCircle, ShoppingBag, X } from 'lucide-react'

interface ProductModalProps {
  selectedProduct: Product
  selectedSize: string
  setSelectedSize: (size: string) => void
  onClose: () => void
  changeCart: (product: Product, size: string, delta: number) => void
  setNotice: (notice: string) => void
}

const rawWa = import.meta.env.VITE_WHATSAPP_NUMBER || ''
const whatsappNumber = rawWa.replace(/\D/g, '') || '221770000000'

export function ProductModal({
  selectedProduct,
  selectedSize,
  setSelectedSize,
  onClose,
  changeCart,
  setNotice,
}: ProductModalProps) {
  const isAvailable = stockForSize(selectedProduct, selectedSize) > 0

  const whatsappMessage = encodeURIComponent(
    `Bonjour neneen, je souhaite avoir des informations sur : ${selectedProduct.name} (${selectedProduct.color}, taille ${selectedSize}, ${money(selectedProduct.price)}).`,
  )
  const whatsappUrl = whatsappNumber
    ? `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`
    : '#'

  return (
    <div className="modal-backdrop">
      <section
        className="product-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-modal-title"
      >
        <button className="modal-close" onClick={onClose} aria-label="Fermer">
          <X />
        </button>

        <div
          className={`modal-product-image tone-${selectedProduct.color.toLowerCase().replace(/[^a-z]/g, '')}`}
          style={
            selectedProduct.imageUrl
              ? { backgroundImage: `url(${selectedProduct.imageUrl})` }
              : undefined
          }
        >
          {!selectedProduct.imageUrl && <span className="product-mark">n.</span>}
        </div>

        <div className="modal-product-copy">
          <span className="eyebrow">neneen · {selectedProduct.color}</span>
          <h2 id="product-modal-title">{selectedProduct.name}</h2>
          <p>{selectedProduct.description}</p>
          {usesCollectionImage(selectedProduct) &&
            selectedProduct.color.toLowerCase() !== 'blanc' && (
              <p className="muted">
                Visuel de la collection en blanc. Coloris sélectionné : {selectedProduct.color}.
              </p>
            )}
          <strong className="modal-price">{money(selectedProduct.price)}</strong>

          <label className="form-label">
            <span>Taille</span>
            <select value={selectedSize} onChange={(event) => setSelectedSize(event.target.value)}>
              {selectedProduct.sizes.map((size) => (
                <option
                  value={size}
                  key={size}
                  disabled={stockForSize(selectedProduct, size) === 0}
                >
                  {size} {stockForSize(selectedProduct, size) === 0 ? '— épuisé' : ''}
                </option>
              ))}
            </select>
          </label>

          <div className="modal-actions-stack">
            <button
              className="button button-dark full-button"
              disabled={!isAvailable}
              onClick={() => {
                changeCart(selectedProduct, selectedSize, 1)
                onClose()
                setNotice('Article ajouté à votre panier.')
              }}
            >
              {isAvailable ? 'Ajouter au panier' : 'Épuisé en cette taille'}{' '}
              <ShoppingBag size={16} />
            </button>

            {whatsappNumber && (
              <a
                className="button button-whatsapp full-button"
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Discuter sur WhatsApp <MessageCircle size={16} />
              </a>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
