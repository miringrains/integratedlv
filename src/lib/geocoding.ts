// Geocoding utility using Mapbox Geocoding API

export async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const encodedAddress = encodeURIComponent(address)
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedAddress}.json?access_token=${process.env.NEXT_PUBLIC_MAPBOX_API_KEY}&limit=1`
    )

    if (!response.ok) return null

    const data = await response.json()
    
    if (data.features && data.features.length > 0) {
      const [lng, lat] = data.features[0].center
      return { lat, lng }
    }

    return null
  } catch (error) {
    console.error('Geocoding error:', error)
    return null
  }
}

export function buildAddressString(location: {
  address?: string | null
  city?: string | null
  state?: string | null
  zip_code?: string | null
}): string {
  const parts = [
    location.address,
    location.city,
    location.state,
    location.zip_code
  ].filter(Boolean)
  
  return parts.join(', ')
}





