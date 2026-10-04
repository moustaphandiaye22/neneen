import { Check, X } from 'lucide-react'

type FeedbackBannersProps = {
  notice: string
  error: string
  catalogError?: Error | null
  onDismissNotice: () => void
  onDismissError: () => void
}

export function FeedbackBanners({
  notice,
  error,
  catalogError,
  onDismissNotice,
  onDismissError,
}: FeedbackBannersProps) {
  return (
    <>
      {notice && (
        <div className="notice" role="status">
          <Check size={16} />
          {notice}
          <button onClick={onDismissNotice} aria-label="Fermer">
            <X size={14} />
          </button>
        </div>
      )}
      {(error || catalogError) && (
        <div className="error-banner" role="alert">
          {error || catalogError?.message}
          <button onClick={onDismissError} aria-label="Fermer">
            <X size={14} />
          </button>
        </div>
      )}
    </>
  )
}
