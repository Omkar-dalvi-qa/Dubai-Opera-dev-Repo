import { useSyncExternalStore } from 'react';

type HeroStore = {
    slide: number;
    theme: string;
    listeners: Set<() => void>;
    setSlide: (s: number) => void;
    setTheme: (t: string) => void;
    subscribe: (listener: () => void) => () => void;
    getSnapshot: () => number;
    getThemeSnapshot: () => string;
};

export const heroStore: HeroStore = {
    slide: 0,
    theme: 'black',
    listeners: new Set(),
    setSlide: (s: number) => {
        if (heroStore.slide !== s) {
            heroStore.slide = s;
            heroStore.listeners.forEach(l => l());
        }
    },
    setTheme: (t: string) => {
        if (heroStore.theme !== t) {
            heroStore.theme = t;
            heroStore.listeners.forEach(l => l());
        }
    },
    subscribe: (listener: () => void) => {
        heroStore.listeners.add(listener);
        return () => {
            heroStore.listeners.delete(listener);
        };
    },
    getSnapshot: () => heroStore.slide,
    getThemeSnapshot: () => heroStore.theme,
};

export function useHeroSlide() {
    return useSyncExternalStore(heroStore.subscribe, heroStore.getSnapshot, heroStore.getSnapshot);
}

export function useHeroTheme() {
    return useSyncExternalStore(heroStore.subscribe, heroStore.getThemeSnapshot, heroStore.getThemeSnapshot);
}
