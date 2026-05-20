import { Component, Input, OnInit, AfterViewInit, ElementRef, ViewChild, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="map-wrapper" *ngIf="hasValidCoordinates">
      <div class="map-info-overlay">
        <!-- Botón de ubicación del usuario -->
        <div class="info-card" style="margin-bottom: 8px;">
          <div class="info-row" *ngIf="locationStatus">
            <span style="font-size: 12px; color: #64748b;">{{ locationStatus }}</span>
          </div>
          <div class="info-row" *ngIf="!userLat">
            <button (click)="retryLocation()" class="retry-button">
              📍 Ver mi ubicación
            </button>
          </div>
          <div class="info-row" *ngIf="userLat">
            <span style="font-size: 12px; color: #22c55e;">✓ Ubicación activa</span>
          </div>
        </div>
        
        <div class="info-card" *ngIf="routeInfo">
          <div class="info-row" *ngIf="routeInfo.distance">
            <span class="info-label">Distancia por vía:</span>
            <span class="info-value" style="color: #2563eb;">{{ routeInfo.distance }}</span>
          </div>
          <div class="info-row" *ngIf="routeInfo.duration">
            <span class="info-label">Tiempo estimado:</span>
            <span class="info-value" style="color: #2563eb;">{{ routeInfo.duration }}</span>
          </div>
          
          <!-- Botón Cómo llegar -->
          <div class="info-row" style="margin-top: 8px;">
            <a [href]="mapsUrl" 
               target="_blank"
               rel="noopener"
               class="directions-button"
               *ngIf="mapsUrl">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
              Cómo llegar
            </a>
          </div>
        </div>
      </div>
      
      <div #mapContainer class="map-canvas"></div>
    </div>
    
    <div *ngIf="!hasValidCoordinates" class="map-fallback">
      <div class="flex flex-col items-center justify-center h-full text-slate-400">
        <svg class="w-12 h-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
        </svg>
        <span class="text-sm">Ubicación no disponible</span>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; width: 100%; height: 100%; }
    .map-wrapper { position: relative; width: 100%; height: 100%; min-height: 400px; border-radius: 12px; overflow: hidden; }
    .map-canvas { width: 100%; height: 100%; min-height: 400px; background: #e5e7eb; }
    .map-fallback { width: 100%; height: 100%; min-height: 400px; background: #f8fafc; border-radius: 12px; }
    .map-info-overlay { position: absolute; top: 12px; left: 12px; z-index: 10; pointer-events: none; }
    .info-card { background: rgba(255,255,255,0.95); backdrop-filter: blur(8px); border-radius: 10px; padding: 12px 16px; box-shadow: 0 2px 12px rgba(0,0,0,0.15); pointer-events: auto; }
    .info-row { display: flex; align-items: center; gap: 8px; }
    .info-label { font-size: 12px; color: #64748b; font-weight: 500; }
    .info-value { font-size: 14px; font-weight: 600; }
    
    .directions-button {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: #2563eb;
      color: white;
      padding: 8px 16px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      text-decoration: none;
      transition: all 0.2s;
      pointer-events: auto;
    }
    .directions-button:hover {
      background: #1d4ed8;
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba(37, 99, 235, 0.4);
    }
    .directions-button svg {
      flex-shrink: 0;
    }
    
    .retry-button {
      background: #f1f5f9;
      color: #475569;
      border: 1px solid #cbd5e1;
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }
    .retry-button:hover {
      background: #e2e8f0;
      border-color: #94a3b8;
    }
  `]
})
export class MapComponent implements OnInit, AfterViewInit {
  @Input() lat: number | null = null;
  @Input() lng: number | null = null;
  @Input() zoom: number = 14;
  
  @ViewChild('mapContainer') mapContainer!: ElementRef<HTMLDivElement>;

  private mapInstance: any = null;
  userLat: number | null = null;
  userLng: number | null = null;
  
  routeInfo: { 
    distance?: string; 
    duration?: string;
  } | null = null;
  
  mapsUrl: string = '';
  
  // Permission-related state
  locationStatus: string = '';
  showRetryButton: boolean = false;
  private permissionStatus: PermissionStatus | null = null;

  get hasValidCoordinates(): boolean {
    return this.lat !== null && this.lng !== null && 
           !isNaN(this.lat) && !isNaN(this.lng) && 
           this.lat !== 0 && this.lng !== 0;
  }

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.loadMapLibre();
    
    // Generate maps URL for directions
    if (this.hasValidCoordinates) {
      this.mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${this.lat},${this.lng}`;
    }
    
    // Initialize location permission handling
    this.initializeLocationPermission();
  }

  ngAfterViewInit(): void {
    if (this.hasValidCoordinates) {
      this.initMapWhenReady();
    }
  }

  // Public method to retry getting location (called from template)
  retryLocation(): void {
    this.locationStatus = 'Solicitando ubicación...';
    this.showRetryButton = false;
    this.cdr.detectChanges();
    this.requestUserLocation();
  }

  private initializeLocationPermission(): void {
    // Check if Permissions API is available
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'geolocation' as PermissionName })
        .then((permissionStatus) => {
          this.permissionStatus = permissionStatus;
          
          // Listen for permission changes
          permissionStatus.addEventListener('change', () => {
            console.log('[Map] Permission state changed to:', permissionStatus.state);
            this.handlePermissionChange(permissionStatus.state);
          });
          
          // Handle initial state
          this.handlePermissionChange(permissionStatus.state);
        })
        .catch((err) => {
          console.log('[Map] Could not query permission:', err);
          // Fallback: try to get location directly
          this.requestUserLocation();
        });
    } else {
      // No Permissions API available - just try to get location
      console.log('[Map] Permissions API not available');
      this.requestUserLocation();
    }
  }

  private handlePermissionChange(state: PermissionState): void {
    console.log('[Map] Handling permission state:', state);
    
    if (state === 'granted') {
      this.locationStatus = '';
      this.showRetryButton = false;
      this.requestUserLocation();
    } else if (state === 'prompt') {
      // User hasn't decided yet
      this.locationStatus = '';
      this.showRetryButton = true;
      // Don't request location yet - wait for user to click retry
    } else if (state === 'denied') {
      this.locationStatus = 'Permiso de ubicación denegado. Activa la ubicación para ver la ruta.';
      this.showRetryButton = true;
    }
    
    this.cdr.detectChanges();
  }

  private requestUserLocation(): void {
    if (!navigator.geolocation) {
      this.locationStatus = 'Geolocalización no soportada';
      this.showRetryButton = false;
      this.cdr.detectChanges();
      return;
    }
    
    this.locationStatus = 'Obteniendo tu ubicación...';
    this.showRetryButton = false;
    this.cdr.detectChanges();
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log('[Map] Got user location:', position.coords.latitude, position.coords.longitude);
        this.userLat = position.coords.latitude;
        this.userLng = position.coords.longitude;
        this.locationStatus = '';
        this.showRetryButton = false;
        this.cdr.detectChanges();
        
        if (this.mapInstance) {
          this.calculateRouteAndDraw();
        }
      },
      (error) => {
        console.log('[Map] Geolocation error:', error);
        
        // Check current permission state to provide better feedback
        if (this.permissionStatus) {
          if (this.permissionStatus.state === 'denied') {
            this.locationStatus = 'Permiso de ubicación denegado. Activa la ubicación para ver la ruta.';
          } else {
            this.locationStatus = 'No se pudo obtener tu ubicación. Intenta de nuevo.';
          }
        } else {
          // Fallback error handling
          this.locationStatus = 'No se pudo obtener tu ubicación. Intenta de nuevo.';
        }
        this.showRetryButton = true;
        this.cdr.detectChanges();
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }

  private async calculateRouteAndDraw(): Promise<void> {
    if (!this.hasValidCoordinates || this.userLat === null || this.userLng === null) return;
    
    try {
      const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${this.userLng},${this.userLat};${this.lng},${this.lat}?overview=full&geometries=geojson`;
      
      const response = await fetch(osrmUrl);
      if (!response.ok) throw new Error('OSRM request failed');
      
      const data = await response.json();
      
      if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        
        // Format distance
        const distanceKm = route.distance / 1000;
        let distanceText: string;
        if (distanceKm < 1) {
          distanceText = Math.round(route.distance) + ' m';
        } else {
          distanceText = distanceKm.toFixed(2) + ' km';
        }
        
        // Format duration
        const durationMin = route.duration / 60;
        let durationText: string;
        if (durationMin < 1) {
          durationText = 'Menos de 1 min';
        } else if (durationMin < 60) {
          durationText = Math.round(durationMin) + ' min';
        } else {
          const hours = Math.floor(durationMin / 60);
          const mins = Math.round(durationMin % 60);
          durationText = hours + 'h ' + mins + 'min';
        }
        
        this.routeInfo = { distance: distanceText, duration: durationText };
        this.cdr.detectChanges();
        
        // Draw the route
        this.drawRouteLine(route.geometry);
      }
    } catch (err) {
      console.log('[Map] OSRM error:', err);
      this.drawStraightLine();
    }
  }

  private loadMapLibre(): void {
    if (document.getElementById('maplibre-script')) return;
    const script = document.createElement('script');
    script.id = 'maplibre-script';
    script.src = 'https://unpkg.com/maplibre-gl@3.6.2/dist/maplibre-gl.js';
    document.head.appendChild(script);
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/maplibre-gl@3.6.2/dist/maplibre-gl.css';
    document.head.appendChild(link);
  }

  private initMapWhenReady(attempts = 0): void {
    if (!this.hasValidCoordinates) return;
    
    const maplibregl = (window as any).maplibregl;
    
    if (maplibregl && this.mapContainer?.nativeElement) {
      this.initMap(maplibregl);
    } else if (attempts < 50) {
      setTimeout(() => this.initMapWhenReady(attempts + 1), 100);
    }
  }

  private initMap(maplibregl: any): void {
    if (this.mapInstance || !this.hasValidCoordinates) return;
    
    try {
      this.mapInstance = new maplibregl.Map({
        container: this.mapContainer.nativeElement,
        style: {
          version: 8,
          sources: {
            osm: {
              type: 'raster',
              tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
              tileSize: 256,
              attribution: '© OpenStreetMap'
            }
          },
          layers: [{
            id: 'osm-layer',
            type: 'raster',
            source: 'osm'
          }]
        },
        center: [this.lng!, this.lat!],
        zoom: this.zoom,
        scrollZoom: false
      });

      this.mapInstance.addControl(new maplibregl.NavigationControl(), 'top-right');
      
      // Business marker
      new maplibregl.Marker({ color: '#e05a20', scale: 1.2 })
        .setLngLat([this.lng!, this.lat!])
        .setPopup(new maplibregl.Popup({ offset: 25 }).setHTML('<strong>Ubicación del negocio</strong>'))
        .addTo(this.mapInstance);
      
      if (this.userLat !== null && this.userLng !== null) {
        this.calculateRouteAndDraw();
      }
      
    } catch (err) {
      console.error('Map init error:', err);
    }
  }

  private drawRouteLine(geometry: any): void {
    if (!this.mapInstance || !geometry) return;
    
    const maplibregl = (window as any).maplibregl;
    const coords = geometry.coordinates || geometry;
    
    if (!coords?.length) return;
    
    this.mapInstance.addSource('route', {
      type: 'geojson',
      data: {
        type: 'Feature',
        properties: {},
        geometry: { type: 'LineString', coordinates: coords }
      }
    });
    
    this.mapInstance.addLayer({
      id: 'route-line',
      type: 'line',
      source: 'route',
      layout: { 'line-join': 'round', 'line-cap': 'round' },
      paint: { 
        'line-color': '#2563eb', 
        'line-width': 5,
        'line-opacity': 0.8
      }
    });
    
    // User marker
    new maplibregl.Marker({ color: '#2563eb' })
      .setLngLat([this.userLng!, this.userLat!])
      .setPopup(new maplibregl.Popup({ offset: 25 }).setHTML('<strong>Tu ubicación</strong>'))
      .addTo(this.mapInstance);
    
    // Fit bounds
    const bounds = new maplibregl.LngLatBounds();
    coords.forEach((c: number[]) => bounds.extend(c));
    this.mapInstance.fitBounds(bounds, { padding: 100, duration: 1000 });
  }

  private drawStraightLine(): void {
    if (!this.mapInstance || this.userLat === null || this.userLng === null) return;
    
    const maplibregl = (window as any).maplibregl;
    
    // Calculate distance
    const R = 6371;
    const dLat = (this.userLat - this.lat!) * Math.PI / 180;
    const dLon = (this.userLng - this.lng!) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(this.lat! * Math.PI / 180) * Math.cos(this.userLat * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    let distanceText: string;
    if (distance < 1) {
      distanceText = (distance * 1000).toFixed(0) + ' m';
    } else {
      distanceText = distance.toFixed(2) + ' km';
    }
    
    this.routeInfo = { distance: distanceText + ' (línea recta)', duration: 'N/A' };
    this.cdr.detectChanges();
    
    // Draw dashed straight line
    this.mapInstance.addSource('line', {
      type: 'geojson',
      data: {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: [[this.userLng, this.userLat], [this.lng!, this.lat!]]
        }
      }
    });
    
    this.mapInstance.addLayer({
      id: 'line-layer',
      type: 'line',
      source: 'line',
      layout: { 'line-join': 'round', 'line-cap': 'round' },
      paint: { 
        'line-color': '#94a3b8', 
        'line-width': 3,
        'line-dasharray': [4, 4]
      }
    });
    
    // User marker
    new maplibregl.Marker({ color: '#2563eb' })
      .setLngLat([this.userLng, this.userLat])
      .setPopup(new maplibregl.Popup({ offset: 25 }).setHTML('<strong>Tu ubicación</strong>'))
      .addTo(this.mapInstance);
    
    // Fit bounds
    const bounds = new maplibregl.LngLatBounds();
    bounds.extend([this.userLng, this.userLat]);
    bounds.extend([this.lng!, this.lat!]);
    this.mapInstance.fitBounds(bounds, { padding: 100, duration: 1000 });
  }
}
