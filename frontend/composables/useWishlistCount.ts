/** Uses useWishlist for reactive count; shared with index and wishlist page. */
export function useWishlistCount() {
  const { wishlistCount } = useWishlist()
  return { wishlistCount }
}
