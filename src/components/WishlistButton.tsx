'use client'

interface Props {
  wishlisted: boolean
  onClick:    () => void
  label?:     string
}

export default function WishlistButton({ wishlisted, onClick, label }: Props) {
  return (
    <button
      data-testid="wishlist-button"
      aria-label={wishlisted ? `Remove ${label ?? 'item'} from wishlist` : `Save ${label ?? 'item'} to wishlist`}
      onClick={onClick}
      className={`rounded p-1 text-lg transition-colors ${
        wishlisted ? 'text-rose-500 hover:text-rose-400' : 'text-gray-300 hover:text-rose-400'
      }`}
    >
      {wishlisted ? '♥' : '♡'}
    </button>
  )
}
