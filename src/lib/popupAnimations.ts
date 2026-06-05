// lib/popupAnimations.ts
import { gsap } from "gsap";

function waitForFrames(count = 2) {
  return new Promise<void>((resolve) => {
    const step = () => {
      count -= 1;
      if (count <= 0) resolve();
      else requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });
}

export async function runEntranceAnimation(
  overlay: HTMLElement,
  popup: HTMLElement,
  sourceRect: DOMRect | null,
  cardArtHeight: number,
) {
  await waitForFrames();
  const fadeContent = popup.querySelectorAll<HTMLElement>(".fade-content");
  const poster = popup.querySelector<HTMLElement>(".poster");
  const title = popup.querySelector<HTMLElement>("h2");
  const rating = popup.querySelector<HTMLElement>(".rating");

  gsap.set(overlay, { opacity: 0 });
  gsap.set(fadeContent, { opacity: 0, y: 15 });
  gsap.set(popup, {
    opacity: 1,
    transformOrigin: "top left",
    willChange: "transform,width,height,border-radius",
  });

  const targetRect = popup.getBoundingClientRect();
  const hasSource =
    sourceRect &&
    sourceRect.width > 0 &&
    sourceRect.height > 0 &&
    targetRect.width > 0;

  const tl = gsap.timeline();

  if (hasSource) {
    const scaleX = sourceRect.width / targetRect.width;
    const scaleY = sourceRect.height / targetRect.height;
    const deltaX = sourceRect.left - targetRect.left;
    const deltaY = sourceRect.top - targetRect.top;

    tl.fromTo(
      overlay,
      { opacity: 0 },
      { opacity: 1, duration: 0.3, ease: "power2.out" },
      0,
    ).fromTo(
      popup,
      { x: deltaX, y: deltaY, scaleX, scaleY, borderRadius: 12 },
      {
        x: 0,
        y: 0,
        scaleX: 1,
        scaleY: 1,
        borderRadius: 20,
        duration: 0.55,
        ease: "power3.inOut",
        force3D: true,
        clearProps: "transform,transformOrigin,willChange",
      },
      0,
    );

    if (poster) {
      const pRect = poster.getBoundingClientRect();
      tl.fromTo(
        poster,
        {
          x: -pRect.left + targetRect.left,
          y: -pRect.top + targetRect.top,
          scaleX: sourceRect.width / pRect.width,
          scaleY: cardArtHeight / pRect.height,
          transformOrigin: "top left",
        },
        {
          x: 0,
          y: 0,
          scaleX: 1,
          scaleY: 1,
          duration: 0.55,
          ease: "power3.inOut",
        },
        0,
      );
    }

    if (title) {
      const tRect = title.getBoundingClientRect();
      tl.fromTo(
        title,
        {
          x: 16 / scaleX - (tRect.left - targetRect.left),
          y: (cardArtHeight + 16) / scaleY - (tRect.top - targetRect.top),
          scale: 0.7 / scaleX,
          transformOrigin: "left center",
        },
        { x: 0, y: 0, scale: 1, duration: 0.55, ease: "power3.inOut" },
        0,
      );
    }

    if (rating) {
      const rRect = rating.getBoundingClientRect();
      tl.fromTo(
        rating,
        {
          x: 16 / scaleX - (rRect.left - targetRect.left),
          y: (cardArtHeight + 40) / scaleY - (rRect.top - targetRect.top),
          scale: 0.8 / scaleX,
          transformOrigin: "left center",
        },
        { x: 0, y: 0, scale: 1, duration: 0.55, ease: "power3.inOut" },
        0,
      );
    }

    tl.to(
      fadeContent,
      { opacity: 1, y: 0, duration: 0.35, stagger: 0.02, ease: "power2.out" },
      0.25,
    );
  } else {
    tl.fromTo(
      overlay,
      { opacity: 0 },
      { opacity: 1, duration: 0.3, ease: "power2.out" },
      0,
    )
      .fromTo(
        popup,
        { opacity: 0, scale: 0.95 },
        {
          opacity: 1,
          scale: 1,
          duration: 0.4,
          ease: "power3.out",
          clearProps: "transform",
        },
        0,
      )
      .to(
        fadeContent,
        { opacity: 1, y: 0, duration: 0.3, stagger: 0.02, ease: "power2.out" },
        0.15,
      );
  }

  return tl;
}

export async function runExitAnimation(
  overlay: HTMLElement,
  popup: HTMLElement,
  sourceRect: DOMRect | null,
  cardArtHeight: number,
  onComplete: () => void,
) {
  await waitForFrames(1);
  const fadeContent = popup.querySelectorAll<HTMLElement>(".fade-content");
  const poster = popup.querySelector<HTMLElement>(".poster");
  const title = popup.querySelector<HTMLElement>("h2");
  const rating = popup.querySelector<HTMLElement>(".rating");

  popup.scrollTop = 0;

  const tl = gsap.timeline({ onComplete });

  if (sourceRect && popup) {
    const currentRect = popup.getBoundingClientRect();
    const scaleX = sourceRect.width / currentRect.width;
    const scaleY = sourceRect.height / currentRect.height;
    const deltaX = sourceRect.left - currentRect.left;
    const deltaY = sourceRect.top - currentRect.top;

    tl.to(
      fadeContent,
      { opacity: 0, y: 10, duration: 0.2, ease: "power2.in" },
      0,
    )
      .to(overlay, { opacity: 0, duration: 0.4, ease: "power2.inOut" }, 0.1)
      .to(
        popup,
        {
          x: deltaX,
          y: deltaY,
          scaleX,
          scaleY,
          borderRadius: 12,
          duration: 0.5,
          ease: "power3.inOut",
          transformOrigin: "top left",
          force3D: true,
        },
        0,
      );

    if (poster) {
      const pRect = poster.getBoundingClientRect();
      tl.to(
        poster,
        {
          x: -(pRect.left - currentRect.left),
          y: -(pRect.top - currentRect.top),
          scaleX: currentRect.width / pRect.width,
          scaleY: cardArtHeight / pRect.height,
          transformOrigin: "top left",
          duration: 0.5,
          ease: "power3.inOut",
        },
        0,
      );
    }

    if (title) {
      const tRect = title.getBoundingClientRect();
      tl.to(
        title,
        {
          x: 16 / scaleX - (tRect.left - currentRect.left),
          y: (cardArtHeight + 16) / scaleY - (tRect.top - currentRect.top),
          scale: 0.7 / scaleX,
          transformOrigin: "left center",
          duration: 0.5,
          ease: "power3.inOut",
        },
        0,
      );
    }

    if (rating) {
      const rRect = rating.getBoundingClientRect();
      tl.to(
        rating,
        {
          x: 16 / scaleX - (rRect.left - currentRect.left),
          y: (cardArtHeight + 40) / scaleY - (rRect.top - currentRect.top),
          scale: 0.8 / scaleX,
          transformOrigin: "left center",
          duration: 0.5,
          ease: "power3.inOut",
        },
        0,
      );
    }
  } else {
    tl.to(
      fadeContent,
      { opacity: 0, y: 10, duration: 0.2, ease: "power2.in" },
      0,
    )
      .to(
        popup,
        { opacity: 0, scale: 0.95, duration: 0.3, ease: "power2.in" },
        0,
      )
      .to(overlay, { opacity: 0, duration: 0.3, ease: "power2.in" }, 0);
  }

  return tl;
}
