"use client";

import { useEffect, useState, type ReactNode } from "react";

import { GasNationLoader } from "@/components/brand/gasnation-loader";
import { useAuth } from "@/components/providers/auth-provider";

const INTRO_KEY = "gasnation_intro_seen";
const INTRO_MS = 3000;

function shouldPlayBrandIntro(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  let isReload = false;
  try {
    const nav = performance.getEntriesByType(
      "navigation",
    )[0] as PerformanceNavigationTiming | undefined;
    isReload = nav?.type === "reload";
  } catch {
    isReload = false;
  }

  let firstVisit = true;
  try {
    firstVisit = !sessionStorage.getItem(INTRO_KEY);
    if (firstVisit) {
      sessionStorage.setItem(INTRO_KEY, "1");
    }
  } catch {
    firstVisit = true;
  }

  return firstVisit || isReload;
}

/**
 * Single fullscreen brand splash - covers auth bootstrap + first-visit / hard-reload
 * intro without remounting (avoids flicker).
 */
export function BrandSplashGate({ children }: { children: ReactNode }) {
  const { isLoading: authLoading } = useAuth();
  const [playIntro] = useState(() => shouldPlayBrandIntro());
  const [introElapsed, setIntroElapsed] = useState(() => !playIntro);

  useEffect(() => {
    if (!playIntro) {
      return;
    }

    const id = window.setTimeout(() => {
      setIntroElapsed(true);
    }, INTRO_MS);

    return () => window.clearTimeout(id);
  }, [playIntro]);

  const showSplash = authLoading || !introElapsed;

  // Lock body scroll while splash is up so scrollbar show/hide doesn't shift the UI.
  useEffect(() => {
    if (!showSplash) {
      return;
    }

    const { body } = document;
    const scrollbarGap =
      window.innerWidth - document.documentElement.clientWidth;

    body.classList.add("gn-splash-lock");
    if (scrollbarGap > 0) {
      body.style.paddingRight = `${scrollbarGap}px`;
    }

    return () => {
      body.classList.remove("gn-splash-lock");
      body.style.paddingRight = "";
    };
  }, [showSplash]);

  return (
    <>
      {children}
      {showSplash ? (
        <GasNationLoader variant="fullscreen" className="gn-loader-steady" />
      ) : null}
    </>
  );
}
