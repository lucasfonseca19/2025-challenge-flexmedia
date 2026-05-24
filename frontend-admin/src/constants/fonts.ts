export interface FontOption {
  id: string
  label: string
  href: string
}

export const FONTS: readonly FontOption[] = [
  {
    id: 'Satoshi',
    label: 'Satoshi',
    href: 'https://api.fontshare.com/v2/css?f=satoshi@300,400,500,600,700&display=swap',
  },
  {
    id: 'Outfit',
    label: 'Outfit',
    href: 'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap',
  },
  {
    id: 'Playfair Display',
    label: 'Playfair Display',
    href: 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&display=swap',
  },
  {
    id: 'Cormorant Garamond',
    label: 'Cormorant Garamond',
    href: 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&display=swap',
  },
  {
    id: 'DM Sans',
    label: 'DM Sans',
    href: 'https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap',
  },
  {
    id: 'Space Grotesk',
    label: 'Space Grotesk',
    href: 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap',
  },
]