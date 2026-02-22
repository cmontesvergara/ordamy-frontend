import { effect, Injectable, signal } from '@angular/core';

export interface Theme {
    mode: 'light' | 'dark';
    color: string;
}

@Injectable({
    providedIn: 'root',
})
export class ThemeService {
    public theme = signal<Theme>({ mode: 'light', color: 'base' });

    constructor() {
        this.loadTheme();
        effect(() => {
            this.setTheme();
        });
    }

    private loadTheme() {
        const theme = localStorage.getItem('ordamy-theme');
        if (theme) {
            this.theme.set(JSON.parse(theme));
        }
    }

    private setTheme() {
        localStorage.setItem('ordamy-theme', JSON.stringify(this.theme()));
        this.setThemeClass();
    }

    public get isDark(): boolean {
        return this.theme().mode === 'dark';
    }

    public toggleMode() {
        this.theme.update((t) => ({
            ...t,
            mode: t.mode === 'light' ? 'dark' : 'light',
        }));
    }

    private setThemeClass() {
        document.querySelector('html')!.className = this.theme().mode;
        document
            .querySelector('html')!
            .setAttribute('data-theme', this.theme().color);
    }
}
