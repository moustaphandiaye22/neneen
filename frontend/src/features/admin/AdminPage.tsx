import { useEffect, useState, type SyntheticEvent } from 'react'
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CalendarCheck,
  CheckCircle,
  ChevronRight,
  CircleUserRound,
  ClipboardList,
  CornerDownRight,
  CreditCard,
  Download,
  EyeOff,
  Info,
  ListChecks,
  Lock,
  LogOut,
  MapPin,
  MessageSquare,
  Package,
  Pencil,
  Plus,
  RefreshCw,
  Send,
  Settings,
  ShoppingBag,
  ShoppingCart,
  Tag,
  Trash2,
  Upload,
  Users,
  X,
} from 'lucide-react'
import type { Activity as ActivityType, Product, Row, User } from '../../types'
import {
  chargerVueAdmin,
  enregistrerActivite,
  enregistrerProduit,
  masquerProduit,
  modifierEtatCommande,
  modifierEtatMessage,
  modifierEtatReservation,
  modifierStatutActivite,
  setVariantStock,
  checkIn,
  participantsCsv,
  changeUserRole,
  confirmCash,
  confirmRefund,
  getSiteSettings,
  getProductOptions,
  saveSiteSettings,
  supprimerActiviteDefinitivement,
  supprimerProduitDefinitivement,
  repondreAuMessage,
  type SiteSettings,
} from '../../services/adminService'
import { uploadImage } from '../../services/uploadService'
import { dateLabel, money, paymentMethodLabel, stateLabel, typeLabel } from '../../lib/presentation'

interface AdminPageProps {
  user: User | null
  token: string | null
  signOut: () => void
  setNotice: (notice: string) => void
  setError: (error: string) => void
}

// ── Modal wrapper ────────────────────────────────────────────────────────────
function AdminModal({
  title,
  subtitle,
  onClose,
  children,
}: {
  title: string
  subtitle?: string
  onClose: () => void
  children: React.ReactNode
}) {
  return (
    <div
      className="admin-modal-backdrop"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="admin-modal">
        <div className="admin-modal-header">
          <div>
            {subtitle && <span className="eyebrow">{subtitle}</span>}
            <h3 className="admin-modal-title">{title}</h3>
          </div>
          <button className="admin-modal-close" onClick={onClose} aria-label="Fermer">
            <X size={18} />
          </button>
        </div>
        <div className="admin-modal-body">{children}</div>
      </div>
    </div>
  )
}

function ConfirmModal({
  title,
  message,
  confirmLabel = 'Supprimer',
  cancelLabel = 'Annuler',
  danger = true,
  onConfirm,
  onClose,
}: {
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
  onConfirm: () => void
  onClose: () => void
}) {
  return (
    <div
      className="admin-modal-backdrop"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="admin-modal confirm-modal" style={{ maxWidth: 450 }}>
        <div className="admin-modal-header" style={{ paddingBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {danger && <AlertTriangle size={22} style={{ color: '#ef4444', flexShrink: 0 }} />}
            <h3 className="admin-modal-title">{title}</h3>
          </div>
          <button className="admin-modal-close" onClick={onClose} aria-label="Fermer">
            <X size={18} />
          </button>
        </div>
        <div
          className="admin-modal-body"
          style={{ display: 'flex', flexDirection: 'column', gap: 18 }}
        >
          <p style={{ color: 'var(--muted)', fontSize: '0.95rem', lineHeight: 1.5, margin: 0 }}>
            {message}
          </p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
            <button
              type="button"
              className="admin-btn-secondary"
              onClick={onClose}
              style={{
                padding: '8px 16px',
                borderRadius: 8,
                cursor: 'pointer',
                border: '1px solid var(--border)',
                background: 'var(--surface-muted)',
                color: 'var(--text)',
              }}
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              onClick={() => {
                onConfirm()
                onClose()
              }}
              style={{
                backgroundColor: danger ? '#ef4444' : 'var(--primary)',
                color: '#fff',
                border: 'none',
                padding: '8px 18px',
                borderRadius: 8,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function ImageUploadInput({
  name,
  currentUrl,
  label = 'Photo / Illustration',
}: {
  name: string
  currentUrl?: string
  label?: string
}) {
  const [preview, setPreview] = useState<string | null>(currentUrl || null)
  const [fileName, setFileName] = useState<string | null>(null)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      setFileName(file.name)
      const url = URL.createObjectURL(file)
      setPreview(url)
    }
  }

  return (
    <div className="custom-upload-field">
      <span className="upload-label">{label}</span>
      <div className="upload-dropzone">
        {preview ? (
          <div className="upload-preview-wrap">
            <img src={preview} alt="Aperçu" className="upload-preview-img" />
            <div className="upload-preview-info">
              <span className="upload-preview-name">{fileName || 'Image actuelle'}</span>
              <label className="upload-change-btn">
                <Upload size={13} /> Modifier la photo
                <input
                  type="file"
                  name={name}
                  accept="image/*"
                  onChange={handleChange}
                  style={{ display: 'none' }}
                />
              </label>
            </div>
          </div>
        ) : (
          <label className="upload-zone">
            <div className="upload-zone-icon">
              <Upload size={22} />
            </div>
            <div className="upload-zone-text">
              <strong>Cliquez ou glissez une image ici</strong>
              <small>Formats supportés : PNG, JPG, WEBP (max 5 MB)</small>
            </div>
            <input
              type="file"
              name={name}
              accept="image/*"
              onChange={handleChange}
              style={{ display: 'none' }}
            />
          </label>
        )}
      </div>
    </div>
  )
}

function ActivityFormModal({
  editActivity,
  token,
  onClose,
  refreshAdmin,
  setNotice,
  setError,
}: {
  editActivity: ActivityType | null
  token: string
  onClose: () => void
  refreshAdmin: () => Promise<void>
  setNotice: (msg: string) => void
  setError: (err: string) => void
}) {
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e: SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    setFieldErrors({})
    const formData = new FormData(e.currentTarget)
    const values = Object.fromEntries(formData.entries())

    const errors: Record<string, string> = {}
    if (!String(values.title || '').trim()) {
      errors.title = "Le titre de l'activité est requis."
    }
    if (!String(values.location || '').trim()) {
      errors.location = "Le lieu de l'activité est requis."
    }
    if (!values.startsAt) {
      errors.startsAt = "La date et l'heure de début sont requises."
    }
    if (values.price === '' || Number(values.price) < 0 || isNaN(Number(values.price))) {
      errors.price = 'Veuillez entrer un tarif valide en FCFA.'
    }
    if (!values.capacity || Number(values.capacity) < 1 || isNaN(Number(values.capacity))) {
      errors.capacity = "Le nombre de places doit être d'au moins 1."
    }
    if (!String(values.description || '').trim()) {
      errors.description = "La description de l'activité est requise."
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }

    setBusy(true)
    try {
      const payload = {
        ...values,
        status: editActivity?.status || 'PUBLISHED',
        imageUrl: String(values.imageUrl || editActivity?.imageUrl || ''),
        featured: editActivity?.featured || false,
        gallery: editActivity?.gallery || [],
        startsAt: values.startsAt ? new Date(`${String(values.startsAt)}:00Z`).toISOString() : '',
        price: Number(values.price),
        capacity: Number(values.capacity),
        schedule: String(values.schedule || '')
          .split(/\r?\n/)
          .map((s) => s.trim())
          .filter(Boolean),
        included: String(values.included || '')
          .split(/\r?\n/)
          .map((s) => s.trim())
          .filter(Boolean),
      }
      const file = formData.get('imageFile')
      if (file instanceof File && file.size > 0) {
        payload.imageUrl = await uploadImage(token, 'activities', file)
      }
      await enregistrerActivite(token, payload, editActivity?.id)
      await refreshAdmin()
      setNotice(editActivity ? 'Activité modifiée.' : 'Activité créée avec succès.')
      onClose()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <AdminModal
      title={editActivity?.title || 'Créer une sortie'}
      subtitle={editActivity ? "Modifier l'activité" : 'Nouvelle activité'}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit}>
        <div className="form-section">
          <div className="form-section-title">
            <Info size={14} /> Informations générales
          </div>
          <div className="form-grid">
            <label className="form-field form-field-full">
              <span>Titre de l'activité *</span>
              <input
                name="title"
                defaultValue={editActivity?.title}
                placeholder="Ex. Excursion à Toubab Dialaw"
                className={fieldErrors.title ? 'input-error' : ''}
              />
              {fieldErrors.title && (
                <span className="field-error">
                  <AlertCircle size={13} /> {fieldErrors.title}
                </span>
              )}
            </label>
            <label className="form-field">
              <span>Type *</span>
              <select name="type" defaultValue={editActivity?.type || 'EXCURSION'}>
                <option value="EXCURSION">Excursion</option>
                <option value="AFTERWORK">Afterwork</option>
                <option value="EVENT">Événement</option>
              </select>
            </label>
            <label className="form-field">
              <span>Durée estimée</span>
              <input
                name="duration"
                maxLength={100}
                defaultValue={editActivity?.duration || ''}
                placeholder="Ex. 2 jours, 1 nuit"
              />
            </label>
          </div>
        </div>

        <div className="form-section">
          <div className="form-section-title">
            <MapPin size={14} /> Lieu &amp; Date
          </div>
          <div className="form-grid">
            <label className="form-field">
              <span>Lieu *</span>
              <input
                name="location"
                defaultValue={editActivity?.location}
                placeholder="Ex. Toubab Dialaw"
                className={fieldErrors.location ? 'input-error' : ''}
              />
              {fieldErrors.location && (
                <span className="field-error">
                  <AlertCircle size={13} /> {fieldErrors.location}
                </span>
              )}
            </label>
            <label className="form-field">
              <span>Date &amp; heure de début *</span>
              <input
                type="datetime-local"
                name="startsAt"
                defaultValue={
                  editActivity ? new Date(editActivity.startsAt).toISOString().slice(0, 16) : ''
                }
                className={fieldErrors.startsAt ? 'input-error' : ''}
              />
              {fieldErrors.startsAt && (
                <span className="field-error">
                  <AlertCircle size={13} /> {fieldErrors.startsAt}
                </span>
              )}
            </label>
          </div>
        </div>

        <div className="form-section">
          <div className="form-section-title">
            <Tag size={14} /> Tarif &amp; Capacité
          </div>
          <div className="form-grid">
            <label className="form-field">
              <span>Prix (FCFA) *</span>
              <input
                name="price"
                type="number"
                min="0"
                placeholder="0"
                defaultValue={editActivity?.price}
                className={fieldErrors.price ? 'input-error' : ''}
              />
              {fieldErrors.price && (
                <span className="field-error">
                  <AlertCircle size={13} /> {fieldErrors.price}
                </span>
              )}
            </label>
            <label className="form-field">
              <span>Nombre de places *</span>
              <input
                name="capacity"
                type="number"
                min="1"
                placeholder="20"
                defaultValue={editActivity?.capacity}
                className={fieldErrors.capacity ? 'input-error' : ''}
              />
              {fieldErrors.capacity && (
                <span className="field-error">
                  <AlertCircle size={13} /> {fieldErrors.capacity}
                </span>
              )}
            </label>
            <label className="form-field form-field-full">
              <span>À prévoir / apporter</span>
              <input
                name="bringList"
                maxLength={1000}
                defaultValue={editActivity?.bringList || ''}
                placeholder="Crème solaire, chaussures..."
              />
            </label>
            <ImageUploadInput
              name="imageFile"
              currentUrl={editActivity?.imageUrl}
              label="Photo / Illustration de l'activité"
            />
          </div>
        </div>

        <div className="form-section">
          <div className="form-section-title">
            <ListChecks size={14} /> Description &amp; Programme
          </div>
          <div className="form-grid form-grid-1col">
            <label className="form-field">
              <span>Description *</span>
              <textarea
                name="description"
                rows={3}
                defaultValue={editActivity?.description}
                placeholder="Décrivez l'activité..."
                className={fieldErrors.description ? 'input-error' : ''}
              />
              {fieldErrors.description && (
                <span className="field-error">
                  <AlertCircle size={13} /> {fieldErrors.description}
                </span>
              )}
            </label>
            <label className="form-field">
              <span>Programme (une étape par ligne)</span>
              <textarea
                name="schedule"
                maxLength={5000}
                rows={3}
                defaultValue={editActivity?.schedule?.join('\n') || ''}
                placeholder={'8 h : départ de Dakar\n10 h : arrivée sur site'}
              />
            </label>
            <label className="form-field">
              <span>Inclus dans le prix (un par ligne)</span>
              <textarea
                name="included"
                maxLength={3000}
                rows={2}
                defaultValue={editActivity?.included?.join('\n') || ''}
                placeholder={'Transport aller-retour\nDéjeuner\nGuide'}
              />
            </label>
          </div>
        </div>

        <button className="admin-btn-submit" disabled={busy}>
          {editActivity ? 'Enregistrer les modifications' : "Créer l'activité"}{' '}
          <ArrowRight size={15} />
        </button>
      </form>
    </AdminModal>
  )
}

function ProductFormModal({
  editProduct,
  token,
  colorOptions,
  sizeOptions,
  onClose,
  refreshAdmin,
  setNotice,
  setError,
}: {
  editProduct: Product | null
  token: string
  colorOptions: string[]
  sizeOptions: string[]
  onClose: () => void
  refreshAdmin: () => Promise<void>
  setNotice: (msg: string) => void
  setError: (err: string) => void
}) {
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e: SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    setFieldErrors({})
    const formData = new FormData(e.currentTarget)
    const values = Object.fromEntries(formData.entries())

    const errors: Record<string, string> = {}
    if (!String(values.name || '').trim()) {
      errors.name = "Le nom de l'article est requis."
    }
    if (!values.price || Number(values.price) <= 0 || isNaN(Number(values.price))) {
      errors.price = 'Veuillez entrer un prix valide supérieur à 0 FCFA.'
    }
    if (
      !editProduct &&
      (values.stock === '' || Number(values.stock) < 0 || isNaN(Number(values.stock)))
    ) {
      errors.stock = 'Veuillez préciser le stock initial.'
    }
    if (!String(values.description || '').trim()) {
      errors.description = "La description de l'article est requise."
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }

    setBusy(true)
    try {
      const selectedSizesRaw = formData.getAll('sizes').map(String).filter(Boolean)
      const firstSelected = selectedSizesRaw[0] || 'ALL'
      const finalSizes =
        firstSelected === 'ALL' || firstSelected === 'Toutes'
          ? sizeOptions.length > 0
            ? sizeOptions
            : ['XS', 'S', 'M', 'L', 'XL', 'XXL']
          : selectedSizesRaw

      const payload = {
        ...values,
        color: String(values.color || 'Toutes les couleurs'),
        imageUrl: String(values.imageUrl || editProduct?.imageUrl || ''),
        price: Number(values.price),
        stock: Number(values.stock),
        sizes: finalSizes,
        active: true,
      }
      const file = formData.get('imageFile')
      if (file instanceof File && file.size > 0) {
        payload.imageUrl = await uploadImage(token, 'products', file)
      }
      await enregistrerProduit(token, payload, editProduct?.id)
      await refreshAdmin()
      setNotice(editProduct ? 'Produit modifié.' : 'Produit créé avec succès.')
      onClose()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const defaultSizeValue = editProduct
    ? editProduct.sizes.length > 1 || editProduct.sizes.length === sizeOptions.length
      ? 'ALL'
      : editProduct.sizes[0] || 'ALL'
    : 'ALL'

  return (
    <AdminModal
      title={editProduct?.name || 'Ajouter un article'}
      subtitle="Catalogue boutique"
      onClose={onClose}
    >
      <form onSubmit={handleSubmit}>
        <div className="form-section">
          <div className="form-section-title">
            <ShoppingCart size={14} /> Informations de l'article
          </div>
          <div className="form-grid">
            <label className="form-field form-field-full">
              <span>Nom de l'article *</span>
              <input
                name="name"
                defaultValue={editProduct?.name}
                placeholder="Ex. T-shirt neneen"
                className={fieldErrors.name ? 'input-error' : ''}
              />
              {fieldErrors.name && (
                <span className="field-error">
                  <AlertCircle size={13} /> {fieldErrors.name}
                </span>
              )}
            </label>
            <label className="form-field">
              <span>Prix (FCFA) *</span>
              <input
                name="price"
                type="number"
                min="1"
                placeholder="0"
                defaultValue={editProduct?.price}
                className={fieldErrors.price ? 'input-error' : ''}
              />
              {fieldErrors.price && (
                <span className="field-error">
                  <AlertCircle size={13} /> {fieldErrors.price}
                </span>
              )}
            </label>
            <label className="form-field">
              <span>Couleur *</span>
              <select name="color" defaultValue={editProduct?.color || 'Toutes les couleurs'}>
                <option value="Toutes les couleurs">Toutes les couleurs</option>
                {colorOptions
                  .filter((c) => c !== 'Toutes les couleurs')
                  .map((c) => (
                    <option value={c} key={c}>
                      {c}
                    </option>
                  ))}
              </select>
            </label>
            <label className="form-field">
              <span>Taille * {editProduct && <em>(fixe après création)</em>}</span>
              <select name="sizes" disabled={Boolean(editProduct)} defaultValue={defaultSizeValue}>
                <option value="ALL">Toutes les tailles</option>
                {sizeOptions.map((s) => (
                  <option value={s} key={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            <label className="form-field">
              <span>Stock initial * {editProduct && <em>(gérer par taille)</em>}</span>
              <input
                name="stock"
                type="number"
                min="0"
                disabled={Boolean(editProduct)}
                defaultValue={editProduct?.stock}
                placeholder="10"
                className={fieldErrors.stock ? 'input-error' : ''}
              />
              {fieldErrors.stock && (
                <span className="field-error">
                  <AlertCircle size={13} /> {fieldErrors.stock}
                </span>
              )}
            </label>
            <ImageUploadInput
              name="imageFile"
              currentUrl={editProduct?.imageUrl}
              label="Photo du produit"
            />
            <label className="form-field form-field-full">
              <span>Description *</span>
              <textarea
                name="description"
                rows={3}
                defaultValue={editProduct?.description}
                placeholder="Décrivez le produit..."
                className={fieldErrors.description ? 'input-error' : ''}
              />
              {fieldErrors.description && (
                <span className="field-error">
                  <AlertCircle size={13} /> {fieldErrors.description}
                </span>
              )}
            </label>
          </div>
        </div>

        <button className="admin-btn-submit" disabled={busy}>
          {editProduct ? 'Enregistrer les modifications' : "Ajouter l'article"}{' '}
          <ArrowRight size={15} />
        </button>
      </form>

      {editProduct && (
        <div className="stock-variants">
          <h4>Stock par taille</h4>
          <div className="stock-variant-list">
            {(editProduct.variants || []).map((variant) => (
              <form
                key={variant.size}
                className="stock-variant-row"
                onSubmit={async (e) => {
                  e.preventDefault()
                  const data = new FormData(e.currentTarget)
                  try {
                    await setVariantStock(token, editProduct.id, {
                      size: variant.size,
                      color: editProduct.color,
                      stock: Number(data.get('stock')),
                    })
                    await refreshAdmin()
                    setNotice('Stock mis à jour.')
                  } catch (err) {
                    setError((err as Error).message)
                  }
                }}
              >
                <span className="variant-size-label">{variant.size}</span>
                <input
                  type="number"
                  name="stock"
                  min="0"
                  defaultValue={variant.stock}
                  className="variant-stock-input"
                />
                <button type="submit" className="admin-btn-small">
                  <CheckCircle size={14} /> OK
                </button>
              </form>
            ))}
          </div>
        </div>
      )}
    </AdminModal>
  )
}

export function AdminPage({ user, token, signOut, setNotice, setError }: AdminPageProps) {
  const [adminTab, setAdminTab] = useState('dashboard')
  const [adminData, setAdminData] = useState<Row>({})
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null)
  const [productOptions, setProductOptions] = useState<{ colors: string[]; sizes: string[] }>({
    colors: [],
    sizes: [],
  })
  const [editActivity, setEditActivity] = useState<ActivityType | null>(null)
  const [activityModalOpen, setActivityModalOpen] = useState(false)
  const [editProduct, setEditProduct] = useState<Product | null>(null)
  const [productModalOpen, setProductModalOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<{
    type: 'activity' | 'product'
    id: string
    title: string
  } | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (token && adminTab === 'settings' && user?.role === 'ADMIN')
      void getSiteSettings(token)
        .then((result) => setSiteSettings(result.settings))
        .catch((reason) => setError((reason as Error).message))
    if (token && adminTab === 'products')
      void getProductOptions(token)
        .then((result) =>
          setProductOptions({
            colors: result.colors.map((color) => color.label),
            sizes: result.sizes.map((size) => size.label),
          }),
        )
        .catch((reason) => setError((reason as Error).message))
    if (token && ['ADMIN', 'STAFF'].includes(user?.role || ''))
      void chargerVueAdmin(token, adminTab)
        .then(setAdminData)
        .catch((reason: Error) => setError(reason.message))
  }, [token, user, adminTab, setError])

  async function refreshAdmin() {
    if (!token) return
    try {
      setAdminData(await chargerVueAdmin(token, adminTab))
    } catch (reason) {
      setError((reason as Error).message)
    }
  }

  async function runForm(
    event: SyntheticEvent<HTMLFormElement>,
    action: (data: FormData) => Promise<void>,
  ) {
    event.preventDefault()
    setBusy(true)
    setError('')
    setNotice('')
    try {
      await action(new FormData(event.currentTarget))
    } catch (reason) {
      setError((reason as Error).message)
    } finally {
      setBusy(false)
    }
  }

  async function adminStatus(action: (sessionToken: string) => Promise<unknown>) {
    if (!token) {
      setError('Votre session a expiré. Reconnectez-vous pour continuer.')
      return
    }
    try {
      await action(token)
      await refreshAdmin()
      setNotice('Mise à jour enregistrée.')
    } catch (reason) {
      setError((reason as Error).message)
    }
  }

  const tabDefs: { id: string; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: "Vue d'ensemble", icon: <BarChart3 size={16} /> },
    { id: 'activities', label: 'Activités', icon: <Activity size={16} /> },
    { id: 'bookings', label: 'Réservations', icon: <CalendarCheck size={16} /> },
    { id: 'orders', label: 'Commandes', icon: <ShoppingBag size={16} /> },
    { id: 'payments', label: 'Paiements', icon: <CreditCard size={16} /> },
    { id: 'products', label: 'Produits', icon: <Package size={16} /> },
    { id: 'customers', label: 'Clients', icon: <Users size={16} /> },
    { id: 'messages', label: 'Messages', icon: <MessageSquare size={16} /> },
    { id: 'settings', label: 'Paramètres', icon: <Settings size={16} /> },
    { id: 'check-in', label: 'Contrôle entrées', icon: <ClipboardList size={16} /> },
  ]

  const labels: Record<string, string> = Object.fromEntries(tabDefs.map((t) => [t.id, t.label]))

  const getStatCount = (val: unknown): number | undefined => {
    if (typeof val === 'number') return val
    if (Array.isArray(val)) return val.length
    return undefined
  }

  const getStatRevenue = (val: unknown): number => {
    if (typeof val === 'number') return val
    if (val && typeof val === 'object') {
      const sumObj = (val as { _sum?: { amount?: number } })._sum
      if (sumObj && typeof sumObj.amount === 'number') return sumObj.amount
    }
    return Number(val || 0)
  }

  const stats: Array<[string, string | number | undefined, React.ReactNode, string]> = [
    ['Membres', getStatCount(adminData.customers), <Users size={20} />, 'var(--wine)'],
    ['Activités', getStatCount(adminData.activities), <Activity size={20} />, '#2d6a9f'],
    ['Réservations', getStatCount(adminData.bookings), <CalendarCheck size={20} />, '#1a7f5a'],
    ['Commandes', getStatCount(adminData.orders), <ShoppingBag size={20} />, '#7a3f00'],
    [
      'Messages à lire',
      typeof adminData.unreadMessages === 'number'
        ? adminData.unreadMessages
        : Array.isArray(adminData.messages)
          ? adminData.messages.filter((m: Row) => String(m.status) === 'NEW').length
          : undefined,
      <MessageSquare size={20} />,
      '#6a3590',
    ],
    [
      'Ventes confirmées',
      money(getStatRevenue(adminData.revenue)),
      <CreditCard size={20} />,
      'var(--coral)',
    ],
  ]

  const activitiesData = Array.isArray(adminData.activities)
    ? (adminData.activities as ActivityType[])
    : []
  const productsData = Array.isArray(adminData.products) ? (adminData.products as Product[]) : []
  const colorOptions = productOptions.colors
  const sizeOptions = productOptions.sizes
  const rows = (key: string) => (Array.isArray(adminData[key]) ? adminData[key] : []) as Row[]

  return (
    <div className="admin-shell">
      {/* ── Sidebar ── */}
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <div className="admin-brand-logo">n</div>
          <div>
            <div className="admin-brand-name">neneen</div>
            <div className="admin-brand-role">Espace de gestion</div>
          </div>
        </div>

        <nav className="admin-nav">
          {tabDefs.map((tab) => (
            <button
              key={tab.id}
              className={`admin-nav-item${adminTab === tab.id ? ' active' : ''}`}
              onClick={() => setAdminTab(tab.id)}
            >
              <span className="admin-nav-icon">{tab.icon}</span>
              <span className="admin-nav-label">{tab.label}</span>
              {adminTab === tab.id && <ChevronRight size={14} className="admin-nav-chevron" />}
            </button>
          ))}
        </nav>

        {user && (
          <div className="admin-sidebar-footer">
            <div className="admin-sidebar-user">
              <div className="admin-user-avatar">
                <CircleUserRound size={18} />
              </div>
              <div className="admin-user-info">
                <span className="admin-user-name">
                  {user.firstName} {user.lastName}
                </span>
                <span className="admin-user-role">
                  {user.role === 'ADMIN' ? 'Administrateur' : 'Équipe'}
                </span>
              </div>
            </div>
            <button className="admin-signout" onClick={signOut} title="Déconnexion">
              <LogOut size={15} />
            </button>
          </div>
        )}
      </aside>

      {/* ── Main ── */}
      <main className="admin-main">
        {user && ['ADMIN', 'STAFF'].includes(user.role) && token ? (
          <>
            {/* Page header */}
            <div className="admin-header">
              <div className="admin-header-left">
                <span className="admin-header-eyebrow">Espace de travail</span>
                <h1 className="admin-header-title">{labels[adminTab]}</h1>
              </div>
              <div className="admin-header-actions">
                <a className="admin-btn-outline" href="#/">
                  Voir le site <ArrowRight size={14} />
                </a>
                <button
                  className="admin-btn-icon"
                  onClick={() => void refreshAdmin()}
                  title="Actualiser"
                >
                  <RefreshCw size={16} />
                </button>
              </div>
            </div>

            {/* ── Dashboard ── */}
            {adminTab === 'dashboard' && (
              <div className="admin-content">
                <div className="stat-grid">
                  {stats.map(([label, value, icon, color]) => (
                    <article className="stat-card" key={label}>
                      <div
                        className="stat-card-icon"
                        style={{ '--stat-color': color } as React.CSSProperties}
                      >
                        {icon}
                      </div>
                      <div className="stat-card-body">
                        <span className="stat-card-label">{label}</span>
                        <strong className="stat-card-value">{value ?? '—'}</strong>
                      </div>
                    </article>
                  ))}
                </div>
                <div className="admin-callout">
                  <div className="admin-callout-body">
                    <span className="eyebrow" style={{ color: 'rgba(255,255,255,0.6)' }}>
                      Communauté neneen
                    </span>
                    <h3>Gardez votre communauté en mouvement.</h3>
                    <p>Créez des activités engageantes pour fédérer votre communauté.</p>
                  </div>
                  <div className="admin-callout-actions">
                    <button className="admin-btn-white" onClick={() => setAdminTab('activities')}>
                      Créer une activité <ArrowRight size={14} />
                    </button>
                    <button className="admin-btn-ghost" onClick={() => setAdminTab('orders')}>
                      Voir les commandes
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ── Activities ── */}
            {adminTab === 'activities' && (
              <div className="admin-content">
                <div className="admin-toolbar">
                  <button
                    className="admin-btn-primary"
                    onClick={() => {
                      setEditActivity(null)
                      setActivityModalOpen(true)
                    }}
                  >
                    <Plus size={16} /> Ajouter une activité
                  </button>
                </div>
                <div className="admin-table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Activité</th>
                        <th>Date</th>
                        <th>Places</th>
                        <th>État</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(Array.isArray(activitiesData) ? activitiesData : []).map((item) => (
                        <tr key={item.id}>
                          <td>
                            <strong>{item.title}</strong>
                            <small>
                              {typeLabel(item.type)} · {money(item.price)}
                            </small>
                          </td>
                          <td>{dateLabel(item.startsAt)}</td>
                          <td>
                            <span className="admin-badge">
                              {item.reserved}/{item.capacity}
                            </span>
                          </td>
                          <td>
                            <span
                              className={`status-pill status-${String(item.status).toLowerCase()}`}
                            >
                              {stateLabel(item.status)}
                            </span>
                          </td>
                          <td>
                            <div className="admin-row-actions">
                              <button
                                className="admin-icon-btn"
                                title="Exporter participants"
                                onClick={() => {
                                  if (token)
                                    void participantsCsv(token, item.id).catch((r) =>
                                      setError((r as Error).message),
                                    )
                                }}
                              >
                                <Download size={15} />
                              </button>
                              <button
                                className="admin-icon-btn"
                                title="Modifier"
                                onClick={() => {
                                  setEditActivity(item)
                                  setActivityModalOpen(true)
                                }}
                              >
                                <Pencil size={15} />
                              </button>
                              {item.status !== 'CANCELLED' && (
                                <button
                                  className="admin-icon-btn"
                                  title="Clôturer l'événement"
                                  onClick={() =>
                                    void adminStatus((t) =>
                                      modifierStatutActivite(t, item.id, 'CANCELLED'),
                                    )
                                  }
                                >
                                  <Lock size={15} />
                                </button>
                              )}
                              <button
                                className="admin-icon-btn danger"
                                title="Supprimer définitivement"
                                onClick={() =>
                                  setConfirmDelete({
                                    type: 'activity',
                                    id: item.id,
                                    title: item.title,
                                  })
                                }
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── Products ── */}
            {adminTab === 'products' && (
              <div className="admin-content">
                <div className="admin-toolbar">
                  <button
                    className="admin-btn-primary"
                    onClick={() => {
                      setEditProduct(null)
                      setProductModalOpen(true)
                    }}
                  >
                    <Plus size={16} /> Ajouter un produit
                  </button>
                </div>
                <div className="admin-table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Produit</th>
                        <th>Prix</th>
                        <th>Stock</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {productsData.map((item) => (
                        <tr key={item.id}>
                          <td>
                            <strong>{item.name}</strong>
                            <small>{item.color}</small>
                          </td>
                          <td>{money(item.price)}</td>
                          <td>
                            <span className={`admin-badge${Number(item.stock) < 5 ? ' low' : ''}`}>
                              {item.stock}
                            </span>
                          </td>
                          <td>
                            <div className="admin-row-actions">
                              <button
                                className="admin-icon-btn"
                                title="Modifier"
                                onClick={() => {
                                  setEditProduct(item)
                                  setProductModalOpen(true)
                                }}
                              >
                                <Pencil size={15} />
                              </button>
                              <button
                                className="admin-icon-btn"
                                title="Masquer du site"
                                onClick={() => void adminStatus((t) => masquerProduit(t, item.id))}
                              >
                                <EyeOff size={15} />
                              </button>
                              <button
                                className="admin-icon-btn danger"
                                title="Supprimer définitivement"
                                onClick={() =>
                                  setConfirmDelete({
                                    type: 'product',
                                    id: item.id,
                                    title: item.name,
                                  })
                                }
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── Bookings ── */}
            {adminTab === 'bookings' && (
              <div className="admin-content">
                <div className="admin-table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Client</th>
                        <th>Sortie</th>
                        <th>Places</th>
                        <th>Total</th>
                        <th>État</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows('bookings').map((item) => (
                        <tr key={String(item.id)}>
                          <td>
                            <strong>
                              {String((item.user as Row)?.firstName)}{' '}
                              {String((item.user as Row)?.lastName)}
                            </strong>
                            <small>{String((item.user as Row)?.email)}</small>
                          </td>
                          <td>{String((item.activity as Row)?.title)}</td>
                          <td>
                            <span className="admin-badge">{String(item.quantity)}</span>
                          </td>
                          <td>
                            <strong>{money(Number(item.total))}</strong>
                          </td>
                          <td>
                            <div className="admin-row-actions">
                              <select
                                value={String(item.status)}
                                onChange={(e) =>
                                  void adminStatus((t) =>
                                    modifierEtatReservation(t, String(item.id), {
                                      status: e.target.value,
                                    }),
                                  )
                                }
                              >
                                <option value="PENDING">En attente</option>
                                <option value="CONFIRMED">Confirmée</option>
                                <option value="CANCELLED">Annulée</option>
                              </select>
                              {String(item.paymentMethod) === 'CASH' &&
                                ((item.payments as Row[]) || []).some(
                                  (p) => p.status === 'PENDING',
                                ) && (
                                  <button
                                    className="admin-btn-small success"
                                    onClick={() => {
                                      const p = ((item.payments as Row[]) || []).find(
                                        (v) => v.status === 'PENDING',
                                      )
                                      if (p) void adminStatus((t) => confirmCash(t, String(p.id)))
                                    }}
                                  >
                                    <CheckCircle size={13} /> Espèces reçues
                                  </button>
                                )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── Orders ── */}
            {adminTab === 'orders' && (
              <div className="admin-content">
                <div className="admin-table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Client</th>
                        <th>Articles</th>
                        <th>Adresse</th>
                        <th>Total</th>
                        <th>État</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows('orders').map((item) => (
                        <tr key={String(item.id)}>
                          <td>
                            <strong>
                              {String((item.user as Row)?.firstName)}{' '}
                              {String((item.user as Row)?.lastName)}
                            </strong>
                            <small>{String((item.user as Row)?.phone)}</small>
                          </td>
                          <td>
                            <small>
                              {((item.items as Row[]) || [])
                                .map(
                                  (l) =>
                                    `${String(l.name)} · ${String(l.size)} × ${String(l.quantity)}`,
                                )
                                .join(', ')}
                            </small>
                          </td>
                          <td>
                            <small>{String(item.shippingAddress)}</small>
                          </td>
                          <td>
                            <strong>{money(Number(item.total))}</strong>
                          </td>
                          <td>
                            <div className="admin-row-actions">
                              <select
                                value={String(item.status)}
                                onChange={(e) =>
                                  void adminStatus((t) =>
                                    modifierEtatCommande(t, String(item.id), {
                                      status: e.target.value,
                                    }),
                                  )
                                }
                              >
                                <option value="PENDING">En attente</option>
                                <option value="PAID">Payée</option>
                                <option value="PROCESSING">En préparation</option>
                                <option value="SHIPPED">Expédiée</option>
                                <option value="COMPLETED">Terminée</option>
                                <option value="CANCELLED">Annulée</option>
                              </select>
                              {String(item.paymentMethod) === 'CASH' &&
                                ((item.payments as Row[]) || []).some(
                                  (p) => p.status === 'PENDING',
                                ) && (
                                  <button
                                    className="admin-btn-small success"
                                    onClick={() => {
                                      const p = ((item.payments as Row[]) || []).find(
                                        (v) => v.status === 'PENDING',
                                      )
                                      if (p) void adminStatus((t) => confirmCash(t, String(p.id)))
                                    }}
                                  >
                                    <CheckCircle size={13} /> Espèces reçues
                                  </button>
                                )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── Payments ── */}
            {adminTab === 'payments' && (
              <div className="admin-content">
                <div className="admin-table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Client</th>
                        <th>Montant</th>
                        <th>Moyen</th>
                        <th>État</th>
                        <th>Remboursement</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows('payments').map((item) => (
                        <tr key={String(item.id)}>
                          <td>{String((item.user as Row)?.email)}</td>
                          <td>
                            <strong>{money(Number(item.amount))}</strong>
                          </td>
                          <td>{paymentMethodLabel(String(item.method))}</td>
                          <td>
                            <span
                              className={`status-pill status-${String(item.status).toLowerCase()}`}
                            >
                              {stateLabel(String(item.status))}
                            </span>
                          </td>
                          <td>
                            {String(item.status) === 'REFUND_PENDING' && (
                              <form
                                className="refund-form"
                                onSubmit={(e) =>
                                  runForm(e, async (data) => {
                                    if (!token) return
                                    await confirmRefund(
                                      token,
                                      String(item.id),
                                      String(data.get('reference')),
                                    )
                                    await refreshAdmin()
                                    setNotice('Remboursement enregistré.')
                                  })
                                }
                              >
                                <input
                                  name="reference"
                                  required
                                  minLength={3}
                                  placeholder="Référence prestataire"
                                />
                                <button className="admin-btn-small" disabled={busy}>
                                  Confirmer
                                </button>
                              </form>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── Customers ── */}
            {adminTab === 'customers' && (
              <div className="admin-content">
                <div className="admin-table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Client</th>
                        <th>E-mail</th>
                        <th>Téléphone</th>
                        <th>Inscription</th>
                        <th>Rôle</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows('customers').map((item) => (
                        <tr key={String(item.id)}>
                          <td>
                            <div className="customer-cell">
                              <div className="customer-avatar">
                                {String(item.firstName).charAt(0)}
                                {String(item.lastName).charAt(0)}
                              </div>
                              <strong>
                                {String(item.firstName)} {String(item.lastName)}
                              </strong>
                            </div>
                          </td>
                          <td>
                            <small>{String(item.email)}</small>
                          </td>
                          <td>
                            <small>{String(item.phone)}</small>
                          </td>
                          <td>
                            <small>{dateLabel(String(item.createdAt))}</small>
                          </td>
                          <td>
                            {user?.role === 'ADMIN' ? (
                              <select
                                value={String(item.role)}
                                disabled={String(item.id) === user.id}
                                onChange={(e) =>
                                  void adminStatus((t) =>
                                    changeUserRole(
                                      t,
                                      String(item.id),
                                      e.target.value as 'CUSTOMER' | 'STAFF' | 'ADMIN',
                                    ),
                                  )
                                }
                              >
                                <option value="CUSTOMER">Client</option>
                                <option value="STAFF">Équipe</option>
                                <option value="ADMIN">Administrateur</option>
                              </select>
                            ) : (
                              <span className="status-pill">{stateLabel(String(item.role))}</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── Messages ── */}
            {adminTab === 'messages' && (
              <div className="admin-content">
                <div className="message-list">
                  {rows('messages').map((item) => (
                    <article className="message-card" key={String(item.id)}>
                      <div className="message-card-avatar">
                        <MessageSquare size={18} />
                      </div>
                      <div className="message-card-body">
                        <div className="message-card-meta">
                          <strong>{String(item.name)}</strong>
                          <small>{String(item.email)}</small>
                        </div>
                        <p className="message-card-text">{String(item.message)}</p>

                        {Boolean(item.replyText) && (
                          <div className="message-reply-box">
                            <div className="message-reply-header">
                              <CornerDownRight size={14} /> <strong>Votre réponse :</strong>
                            </div>
                            <p>{String(item.replyText)}</p>
                          </div>
                        )}

                        <form
                          className="message-reply-form"
                          onSubmit={(e) =>
                            runForm(e, async (data) => {
                              if (!token) return
                              const replyText = String(data.get('replyText'))
                              if (!replyText.trim()) return
                              await repondreAuMessage(token, String(item.id), replyText)
                              await refreshAdmin()
                              setNotice('Réponse enregistrée avec succès.')
                            })
                          }
                        >
                          <textarea
                            name="replyText"
                            required
                            rows={2}
                            placeholder="Répondre à ce message..."
                          />
                          <button className="admin-btn-small primary" disabled={busy}>
                            <Send size={13} /> Envoyer la réponse
                          </button>
                        </form>
                      </div>
                      <select
                        className="message-status-select"
                        value={String(item.status)}
                        onChange={(e) =>
                          void adminStatus((t) =>
                            modifierEtatMessage(t, String(item.id), { status: e.target.value }),
                          )
                        }
                      >
                        <option value="NEW">Nouveau</option>
                        <option value="READ">Lu</option>
                        <option value="REPLIED">Répondu</option>
                      </select>
                    </article>
                  ))}
                </div>
              </div>
            )}

            {/* ── Settings ── */}
            {adminTab === 'settings' && siteSettings && user?.role === 'ADMIN' && (
              <div className="admin-content">
                <form
                  className="settings-form"
                  onSubmit={(e) =>
                    runForm(e, async (data) => {
                      if (!token || !siteSettings) return
                      const result = await saveSiteSettings(token, {
                        siteName: String(data.get('siteName')),
                        slogan: String(data.get('slogan')),
                        contactEmail: String(data.get('contactEmail')),
                        contactPhone: String(data.get('contactPhone')),
                        whatsapp: String(data.get('whatsapp')),
                        address: String(data.get('address')),
                        instagramUrl: String(data.get('instagramUrl')),
                        facebookUrl: String(data.get('facebookUrl')),
                        tiktokUrl: String(data.get('tiktokUrl')),
                        paymentsLive: siteSettings.paymentsLive,
                      })
                      setSiteSettings(result.settings)
                      setNotice('Paramètres enregistrés.')
                    })
                  }
                >
                  <div className="settings-section">
                    <div className="settings-section-title">
                      <Info size={16} /> Identité du site
                    </div>
                    <div className="form-grid">
                      <label className="form-field">
                        <span>Nom du site</span>
                        <input name="siteName" defaultValue={siteSettings.siteName} required />
                      </label>
                      <label className="form-field">
                        <span>Slogan</span>
                        <input name="slogan" defaultValue={siteSettings.slogan} />
                      </label>
                    </div>
                  </div>

                  <div className="settings-section">
                    <div className="settings-section-title">
                      <MessageSquare size={16} /> Contact &amp; coordonnées
                    </div>
                    <div className="form-grid">
                      <label className="form-field">
                        <span>E-mail de contact</span>
                        <input
                          name="contactEmail"
                          type="email"
                          defaultValue={siteSettings.contactEmail}
                        />
                      </label>
                      <label className="form-field">
                        <span>Téléphone</span>
                        <input name="contactPhone" defaultValue={siteSettings.contactPhone} />
                      </label>
                      <label className="form-field">
                        <span>WhatsApp</span>
                        <input name="whatsapp" defaultValue={siteSettings.whatsapp} />
                      </label>
                      <label className="form-field">
                        <span>Adresse</span>
                        <input name="address" defaultValue={siteSettings.address} />
                      </label>
                    </div>
                  </div>

                  <div className="settings-section">
                    <div className="settings-section-title">
                      <Activity size={16} /> Réseaux sociaux
                    </div>
                    <div className="form-grid">
                      <label className="form-field">
                        <span>Instagram</span>
                        <input
                          name="instagramUrl"
                          type="url"
                          defaultValue={siteSettings.instagramUrl}
                          placeholder="https://instagram.com/..."
                        />
                      </label>
                      <label className="form-field">
                        <span>Facebook</span>
                        <input
                          name="facebookUrl"
                          type="url"
                          defaultValue={siteSettings.facebookUrl}
                          placeholder="https://facebook.com/..."
                        />
                      </label>
                      <label className="form-field">
                        <span>TikTok</span>
                        <input
                          name="tiktokUrl"
                          type="url"
                          defaultValue={siteSettings.tiktokUrl ?? ''}
                          placeholder="https://tiktok.com/@..."
                        />
                      </label>
                    </div>
                  </div>

                  <button className="admin-btn-submit" disabled={busy}>
                    Enregistrer les paramètres <ArrowRight size={15} />
                  </button>
                </form>
              </div>
            )}

            {/* ── Check-in ── */}
            {adminTab === 'check-in' && (
              <div className="admin-content">
                <div className="checkin-card">
                  <div className="checkin-icon">
                    <ClipboardList size={32} />
                  </div>
                  <h3>Contrôle des entrées</h3>
                  <p>Scannez ou saisissez le code du billet pour enregistrer l'arrivée.</p>
                  <form
                    className="checkin-form"
                    onSubmit={(e) =>
                      runForm(e, async (data) => {
                        if (!token) return
                        await checkIn(token, String(data.get('secret')))
                        setNotice('Participant enregistré.')
                        ;(e.currentTarget as HTMLFormElement).reset()
                      })
                    }
                  >
                    <label className="form-field">
                      <span>Code du billet</span>
                      <input
                        name="secret"
                        required
                        placeholder="Saisissez ou scannez le code..."
                        autoFocus
                      />
                    </label>
                    <button className="admin-btn-submit" disabled={busy}>
                      <CheckCircle size={16} /> Enregistrer l'arrivée
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* ══════════════════════════════════════════
                MODALS — Formulaires Pop-up
            ══════════════════════════════════════════ */}
            {activityModalOpen && token && (
              <ActivityFormModal
                editActivity={editActivity}
                token={token}
                onClose={() => setActivityModalOpen(false)}
                refreshAdmin={refreshAdmin}
                setNotice={setNotice}
                setError={setError}
              />
            )}

            {productModalOpen && token && (
              <ProductFormModal
                editProduct={editProduct}
                token={token}
                colorOptions={colorOptions}
                sizeOptions={sizeOptions}
                onClose={() => setProductModalOpen(false)}
                refreshAdmin={refreshAdmin}
                setNotice={setNotice}
                setError={setError}
              />
            )}

            {confirmDelete && (
              <ConfirmModal
                title={
                  confirmDelete.type === 'activity'
                    ? "Supprimer l'activité"
                    : 'Supprimer le produit'
                }
                message={`Voulez-vous vraiment supprimer définitivement "${confirmDelete.title}" ? Cette action est irréversible.`}
                confirmLabel="Oui, supprimer"
                cancelLabel="Annuler"
                danger={true}
                onClose={() => setConfirmDelete(null)}
                onConfirm={() => {
                  if (confirmDelete.type === 'activity') {
                    void adminStatus((t) => supprimerActiviteDefinitivement(t, confirmDelete.id))
                  } else {
                    void adminStatus((t) => supprimerProduitDefinitivement(t, confirmDelete.id))
                  }
                }}
              />
            )}
          </>
        ) : (
          <div className="admin-gate">
            <div className="admin-gate-icon">
              <CircleUserRound size={40} />
            </div>
            <span className="eyebrow">Accès sécurisé</span>
            <h2>Espace réservé aux administrateurs.</h2>
            <p>Connectez-vous avec un compte administrateur ou équipe.</p>
            <a className="admin-btn-primary" href="#/login">
              Se connecter <ArrowRight size={15} />
            </a>
          </div>
        )}
      </main>
    </div>
  )
}
