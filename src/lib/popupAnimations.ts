// lib/popupAnimations.ts

// Mapped GSAP easings to standard CSS cubic-bezier
const EASE = {
  power2In: "cubic-bezier(0.55, 0.085, 0.68, 0.53)",
  power2Out: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
  power2InOut: "cubic-bezier(0.455, 0.03, 0.515, 0.955)",
  power3Out: "cubic-bezier(0.215, 0.61, 0.355, 1)",
  power3InOut: "cubic-bezier(0.645, 0.045, 0.355, 1)",
};

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

// Extend WAAPI Animation to hold a universal promise to prevent environment crashes
interface WAAPIAnimation extends Animation {
  _finishPromise: Promise<void>;
}

// Mimics GSAP timeline to prevent crashes if the React component calls `.kill()` or `.then()`
interface TimelineMock {
  _killed: boolean;
  animations: WAAPIAnimation[];
  kill: () => void;
  reverse: () => void;
  then: (resolve: (val?: any) => void) => void;
}

function createTimelineMock(): TimelineMock {
  return {
    _killed: false,
    animations: [],
    kill() {
      this._killed = true;
      this.animations.forEach((a) => a.cancel());
    },
    reverse() {
      this.animations.forEach((a) => a.reverse());
    },
    then(resolve: (value?: any) => void) {
      // FIXED: Resolving with undefined instead of `this` prevents an infinite await loop
      Promise.all(this.animations.map((a) => a._finishPromise)).then(() =>
        resolve(),
      );
    },
  };
}

// Executes an animation and universally applies its final state to element.style
function playWAAPI(
  el: Element,
  keyframes: Keyframe[],
  options: KeyframeAnimationOptions,
  clearProps: string[] = [],
): WAAPIAnimation {
  const anim = el.animate(keyframes, {
    ...options,
    fill: "both",
  }) as WAAPIAnimation;

  // Use onfinish instead of .finished.then() for maximum cross-browser/webview compatibility
  anim._finishPromise = new Promise<void>((resolve) => {
    anim.onfinish = () => {
      // 1. Commit the final keyframe properties to inline styles
      const lastFrame = keyframes[keyframes.length - 1];
      for (const key in lastFrame) {
        if (
          key !== "offset" &&
          key !== "easing" &&
          lastFrame[key as keyof Keyframe] !== undefined
        ) {
          (el as HTMLElement).style[key as any] = lastFrame[
            key as keyof Keyframe
          ] as string;
        }
      }

      // 2. Handle GSAP-like clearProps
      clearProps.forEach((prop) => {
        ((el as HTMLElement).style as any)[prop] = "";
      });

      // 3. Remove WAAPI layer so it doesn't leak or block contexts
      anim.cancel();
      resolve();
    };

    // Safely resolve on cancel (like during a timeline kill) so Promise.all doesn't hang
    anim.oncancel = () => resolve();
  });

  return anim;
}

export async function runEntranceAnimation(
  overlay: HTMLElement,
  popup: HTMLElement,
  sourceRect: DOMRect | null,
  cardArtHeight: number,
) {
  // Give React time to mount elements to the DOM first
  await waitForFrames();

  const fadeContent = popup.querySelectorAll<HTMLElement>(".fade-content");
  const poster = popup.querySelector<HTMLElement>(".poster");
  const title = popup.querySelector<HTMLElement>("h2");
  const rating = popup.querySelector<HTMLElement>(".rating");

  // GSAP implicitly set these starting values synchronously. We MUST replicate this
  // before reading bounds, otherwise elements will be trapped in "opacity: 0"
  if (overlay) overlay.style.opacity = "0";
  fadeContent.forEach((el) => {
    el.style.opacity = "0";
    el.style.transform = "translate3d(0, 15px, 0)";
  });
  if (popup) {
    popup.style.opacity = "1";
    popup.style.transformOrigin = "top left";
    popup.style.willChange = "transform, width, height, border-radius";
  }

  // Safely measure elements
  const targetRect = popup.getBoundingClientRect();
  const pRect = poster?.getBoundingClientRect() || null;
  const tRect = title?.getBoundingClientRect() || null;
  const rRect = rating?.getBoundingClientRect() || null;

  const hasSource = Boolean(
    sourceRect &&
    sourceRect.width > 0 &&
    sourceRect.height > 0 &&
    targetRect.width > 0,
  );

  const tlMock = createTimelineMock();

  if (hasSource && sourceRect) {
    // Protect against NaN/Infinity
    const scaleX = sourceRect.width / targetRect.width;
    const scaleY = sourceRect.height / targetRect.height;
    const deltaX = sourceRect.left - targetRect.left;
    const deltaY = sourceRect.top - targetRect.top;

    tlMock.animations.push(
      playWAAPI(overlay, [{ opacity: 0 }, { opacity: 1 }], {
        duration: 300,
        easing: EASE.power2Out,
      }),
    );

    tlMock.animations.push(
      playWAAPI(
        popup,
        [
          {
            transform: `translate3d(${deltaX}px, ${deltaY}px, 0) scale(${scaleX}, ${scaleY})`,
            borderRadius: "12px",
          },
          {
            transform: `translate3d(0px, 0px, 0) scale(1, 1)`,
            borderRadius: "20px",
          },
        ],
        { duration: 550, easing: EASE.power3InOut },
        ["transform", "transformOrigin", "willChange"],
      ),
    );

    if (poster && pRect && pRect.width > 0 && pRect.height > 0) {
      poster.style.transformOrigin = "top left";
      tlMock.animations.push(
        playWAAPI(
          poster,
          [
            {
              transform: `translate3d(${-pRect.left + targetRect.left}px, ${-pRect.top + targetRect.top}px, 0) scale(${sourceRect.width / pRect.width}, ${cardArtHeight / pRect.height})`,
            },
            { transform: `translate3d(0px, 0px, 0) scale(1, 1)` },
          ],
          { duration: 550, easing: EASE.power3InOut },
        ),
      );
    }

    if (title && tRect) {
      title.style.transformOrigin = "left center";
      tlMock.animations.push(
        playWAAPI(
          title,
          [
            {
              transform: `translate3d(${16 / scaleX - (tRect.left - targetRect.left)}px, ${(cardArtHeight + 16) / scaleY - (tRect.top - targetRect.top)}px, 0) scale(${0.7 / scaleX})`,
            },
            { transform: `translate3d(0px, 0px, 0) scale(1)` },
          ],
          { duration: 550, easing: EASE.power3InOut },
        ),
      );
    }

    if (rating && rRect) {
      rating.style.transformOrigin = "left center";
      tlMock.animations.push(
        playWAAPI(
          rating,
          [
            {
              transform: `translate3d(${16 / scaleX - (rRect.left - targetRect.left)}px, ${(cardArtHeight + 40) / scaleY - (rRect.top - targetRect.top)}px, 0) scale(${0.8 / scaleX})`,
            },
            { transform: `translate3d(0px, 0px, 0) scale(1)` },
          ],
          { duration: 550, easing: EASE.power3InOut },
        ),
      );
    }

    fadeContent.forEach((el, i) => {
      tlMock.animations.push(
        playWAAPI(
          el,
          [
            { opacity: 0, transform: "translate3d(0, 15px, 0)" },
            { opacity: 1, transform: "translate3d(0, 0px, 0)" },
          ],
          { duration: 350, delay: 250 + i * 20, easing: EASE.power2Out },
        ),
      );
    });
  } else {
    tlMock.animations.push(
      playWAAPI(overlay, [{ opacity: 0 }, { opacity: 1 }], {
        duration: 300,
        easing: EASE.power2Out,
      }),
    );

    tlMock.animations.push(
      playWAAPI(
        popup,
        [
          { opacity: 0, transform: "scale3d(0.95, 0.95, 1)" },
          { opacity: 1, transform: "scale3d(1, 1, 1)" },
        ],
        { duration: 400, easing: EASE.power3Out },
        ["transform", "transformOrigin", "willChange"],
      ),
    );

    fadeContent.forEach((el, i) => {
      tlMock.animations.push(
        playWAAPI(
          el,
          [
            { opacity: 0, transform: "translate3d(0, 15px, 0)" },
            { opacity: 1, transform: "translate3d(0, 0px, 0)" },
          ],
          { duration: 300, delay: 150 + i * 20, easing: EASE.power2Out },
        ),
      );
    });
  }

  return tlMock;
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

  const currentRect = popup.getBoundingClientRect();
  const pRect = poster?.getBoundingClientRect() || null;
  const tRect = title?.getBoundingClientRect() || null;
  const rRect = rating?.getBoundingClientRect() || null;

  popup.style.willChange = "transform, opacity, border-radius";

  const tlMock = createTimelineMock();

  if (sourceRect && popup) {
    const scaleX = sourceRect.width / currentRect.width;
    const scaleY = sourceRect.height / currentRect.height;
    const deltaX = sourceRect.left - currentRect.left;
    const deltaY = sourceRect.top - currentRect.top;

    fadeContent.forEach((el) => {
      tlMock.animations.push(
        playWAAPI(
          el,
          [
            { opacity: 1, transform: "translate3d(0, 0px, 0)" },
            { opacity: 0, transform: "translate3d(0, 10px, 0)" },
          ],
          { duration: 200, easing: EASE.power2In },
        ),
      );
    });

    tlMock.animations.push(
      playWAAPI(overlay, [{ opacity: 1 }, { opacity: 0 }], {
        duration: 400,
        delay: 100,
        easing: EASE.power2InOut,
      }),
    );

    popup.style.transformOrigin = "top left";
    tlMock.animations.push(
      playWAAPI(
        popup,
        [
          {
            transform: `translate3d(0px, 0px, 0) scale(1, 1)`,
            borderRadius: "20px",
          },
          {
            transform: `translate3d(${deltaX}px, ${deltaY}px, 0) scale(${scaleX}, ${scaleY})`,
            borderRadius: "12px",
          },
        ],
        { duration: 500, easing: EASE.power3InOut },
      ),
    );

    if (poster && pRect && pRect.width > 0 && pRect.height > 0) {
      poster.style.transformOrigin = "top left";
      tlMock.animations.push(
        playWAAPI(
          poster,
          [
            { transform: `translate3d(0px, 0px, 0) scale(1, 1)` },
            {
              transform: `translate3d(${-(pRect.left - currentRect.left)}px, ${-(pRect.top - currentRect.top)}px, 0) scale(${currentRect.width / pRect.width}, ${cardArtHeight / pRect.height})`,
            },
          ],
          { duration: 500, easing: EASE.power3InOut },
        ),
      );
    }

    if (title && tRect) {
      title.style.transformOrigin = "left center";
      tlMock.animations.push(
        playWAAPI(
          title,
          [
            { transform: `translate3d(0px, 0px, 0) scale(1)` },
            {
              transform: `translate3d(${16 / scaleX - (tRect.left - currentRect.left)}px, ${(cardArtHeight + 16) / scaleY - (tRect.top - currentRect.top)}px, 0) scale(${0.7 / scaleX})`,
            },
          ],
          { duration: 500, easing: EASE.power3InOut },
        ),
      );
    }

    if (rating && rRect) {
      rating.style.transformOrigin = "left center";
      tlMock.animations.push(
        playWAAPI(
          rating,
          [
            { transform: `translate3d(0px, 0px, 0) scale(1)` },
            {
              transform: `translate3d(${16 / scaleX - (rRect.left - currentRect.left)}px, ${(cardArtHeight + 40) / scaleY - (rRect.top - currentRect.top)}px, 0) scale(${0.8 / scaleX})`,
            },
          ],
          { duration: 500, easing: EASE.power3InOut },
        ),
      );
    }
  } else {
    fadeContent.forEach((el) => {
      tlMock.animations.push(
        playWAAPI(
          el,
          [
            { opacity: 1, transform: "translate3d(0, 0px, 0)" },
            { opacity: 0, transform: "translate3d(0, 10px, 0)" },
          ],
          { duration: 200, easing: EASE.power2In },
        ),
      );
    });

    tlMock.animations.push(
      playWAAPI(
        popup,
        [
          { opacity: 1, transform: "scale3d(1, 1, 1)" },
          { opacity: 0, transform: "scale3d(0.95, 0.95, 1)" },
        ],
        { duration: 300, easing: EASE.power2In },
      ),
    );

    tlMock.animations.push(
      playWAAPI(overlay, [{ opacity: 1 }, { opacity: 0 }], {
        duration: 300,
        easing: EASE.power2In,
      }),
    );
  }

  // Ensures we wait for all internal WAAPI listeners to finish cleanly
  Promise.all(tlMock.animations.map((a) => a._finishPromise)).then(() => {
    if (!tlMock._killed) onComplete();
  });

  return tlMock;
}
