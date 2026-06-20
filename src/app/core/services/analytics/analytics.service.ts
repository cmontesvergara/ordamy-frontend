import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';

export interface AnalyticsConfig {
    enabled: boolean;
    provider: 'umami' | 'gtag' | 'none';
    scriptUrl?: string;
    websiteId?: string;
    trackingId?: string;
    autoTrack?: boolean;
}

export interface PageViewPayload {
    url?: string;
    title?: string;
    referrer?: string;
}

export interface EventPayload {
    name: string;
    data?: Record<string, string | number | boolean>;
}

export interface IdentityPayload {
    id?: string;
    data?: Record<string, string | number | boolean>;
}

/**
 * Provider-agnostic analytics facade.
 *
 * Today it wraps Umami (`window.umami`). Tomorrow it can be swapped for
 * Google Analytics, Mixpanel, Plausible, etc. without touching consumers.
 */
@Injectable({
    providedIn: 'root',
})
export class AnalyticsService {
    private readonly config: AnalyticsConfig;
    private scriptLoaded = false;

    constructor() {
        this.config = this.buildConfig();

        if (this.config.enabled && this.config.provider !== 'none') {
            this.loadScript();
        }
    }

    /**
     * Track a page view. Safe to call before the tracker script finishes loading.
     */
    trackPageView(payload?: PageViewPayload): void {
        if (!this.config.enabled) {
            return;
        }

        this.whenReady((adapter) => adapter.trackPageView(payload));
    }

    /**
     * Track a custom event.
     */
    trackEvent(event: EventPayload): void {
        if (!this.config.enabled) {
            return;
        }

        this.whenReady((adapter) => adapter.trackEvent(event));
    }

    /**
     * Identify the current session/user.
     */
    identify(payload: IdentityPayload): void {
        if (!this.config.enabled) {
            return;
        }

        this.whenReady((adapter) => adapter.identify(payload));
    }

    /**
     * Returns the current configuration (useful for debugging).
     */
    getConfig(): AnalyticsConfig {
        return { ...this.config };
    }

    private buildConfig(): AnalyticsConfig {
        const cfg = (environment as any).analytics as AnalyticsConfig | undefined;

        return {
            enabled: cfg?.enabled ?? false,
            provider: cfg?.provider ?? 'none',
            scriptUrl: cfg?.scriptUrl,
            websiteId: cfg?.websiteId,
            trackingId: cfg?.trackingId,
            autoTrack: cfg?.autoTrack ?? true,
        };
    }

    private loadScript(): void {
        if (this.scriptLoaded || typeof document === 'undefined') {
            return;
        }

        if (this.config.provider === 'umami' && this.config.scriptUrl && this.config.websiteId) {
            const existing = document.querySelector(`script[data-website-id="${this.config.websiteId}"]`);
            if (existing) {
                this.scriptLoaded = true;
                return;
            }

            const script = document.createElement('script');
            script.async = true;
            script.defer = true;
            script.src = this.config.scriptUrl;
            script.setAttribute('data-website-id', this.config.websiteId);
            script.setAttribute('data-auto-track', String(this.config.autoTrack));
            document.head.appendChild(script);
            this.scriptLoaded = true;
        }

        // TODO: gtag loader can be added here when needed.
    }

    private whenReady(action: (adapter: AnalyticsAdapter) => void): void {
        const adapter = this.resolveAdapter();
        if (adapter) {
            action(adapter);
            return;
        }

        // Defer until the tracker is available (max 5s).
        const deadline = Date.now() + 5000;
        const timer = setInterval(() => {
            const resolved = this.resolveAdapter();
            if (resolved || Date.now() > deadline) {
                clearInterval(timer);
                if (resolved) {
                    action(resolved);
                }
            }
        }, 100);
    }

    private resolveAdapter(): AnalyticsAdapter | null {
        switch (this.config.provider) {
            case 'umami':
                return new UmamiAdapter();
            case 'gtag':
                return null; // TODO: implement GtagAdapter.
            default:
                return null;
        }
    }
}

interface AnalyticsAdapter {
    trackPageView(payload?: PageViewPayload): void;
    trackEvent(event: EventPayload): void;
    identify(payload: IdentityPayload): void;
}

class UmamiAdapter implements AnalyticsAdapter {
    private get umami(): any {
        return (window as any).umami;
    }

    trackPageView(payload?: PageViewPayload): void {
        const umami = this.umami;
        if (!umami) {
            return;
        }

        if (payload) {
            umami.track((props: any) => ({ ...props, ...payload }));
        } else {
            umami.track();
        }
    }

    trackEvent(event: EventPayload): void {
        const umami = this.umami;
        if (!umami) {
            return;
        }

        if (event.data) {
            umami.track(event.name, event.data);
        } else {
            umami.track(event.name);
        }
    }

    identify(payload: IdentityPayload): void {
        const umami = this.umami;
        if (!umami) {
            return;
        }

        if (payload.id && payload.data) {
            umami.identify(payload.id, payload.data);
        } else if (payload.id) {
            umami.identify(payload.id);
        } else if (payload.data) {
            umami.identify(payload.data);
        }
    }
}
