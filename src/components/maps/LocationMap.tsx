'use client'

import { useEffect, useRef } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_API_KEY || ''

interface LocationMapProps {
  latitude: number
  longitude: number
  locationName?: string
  height?: string
  zoom?: number
}

export function LocationMap({ 
  latitude, 
  longitude, 
  locationName,
  height = '300px',
  zoom = 15
}: LocationMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)

  useEffect(() => {
    if (!mapContainer.current || map.current) return

    // Initialize map with custom style
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      // Use light style with muted colors (no bright blue)
      style: 'mapbox://styles/mapbox/light-v11',
      center: [longitude, latitude],
      zoom: zoom,
    })

    // Customize map colors to match brand
    map.current.on('load', () => {
      if (!map.current) return
      
      // Adjust water color to be more neutral (remove blue)
      if (map.current.getLayer('water')) {
        map.current.setPaintProperty('water', 'fill-color', '#e8ebe9')
      }
      
      // Adjust building colors to match card gray
      if (map.current.getLayer('building')) {
        map.current.setPaintProperty('building', 'fill-color', '#f4f7f5')
        map.current.setPaintProperty('building', 'fill-outline-color', '#d1d5d3')
      }
    })

    // Add marker with custom color
    const el = document.createElement('div')
    el.className = 'custom-marker'
    el.style.width = '30px'
    el.style.height = '30px'
    el.style.borderRadius = '50%'
    el.style.backgroundColor = '#FF6F12' // Orange
    el.style.border = '3px solid white'
    el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)'

    new mapboxgl.Marker(el)
      .setLngLat([longitude, latitude])
      .setPopup(
        locationName 
          ? new mapboxgl.Popup({ offset: 25 }).setHTML(`<div style="padding:4px;font-size:12px;font-weight:600;">${locationName}</div>`)
          : undefined
      )
      .addTo(map.current)

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'bottom-right')

    return () => {
      map.current?.remove()
    }
  }, [latitude, longitude, locationName, zoom])

  return (
    <div 
      ref={mapContainer} 
      style={{ height }} 
      className="rounded-lg overflow-hidden border-2 border-gray-200"
    />
  )
}

