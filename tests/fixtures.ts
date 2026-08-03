import { expect, Page, test as base } from '@playwright/test';

async function disableAnimations(page: Page) {
  await page.addInitScript(() => {
    const installAnimationOverride = () => {
      const style = document.createElement('style');
      style.setAttribute('data-test-disable-angular-animations', '');
      style.textContent = `
        *, *::before, *::after {
          transition-duration: 0ms !important;
          transition-delay: 0ms !important;
          animation-duration: 0ms !important;
          animation-delay: 0ms !important;
        }
      `;
      document.documentElement.appendChild(style);
    };

    if (document.documentElement) {
      installAnimationOverride();
    } else {
      document.addEventListener('DOMContentLoaded', installAnimationOverride, {
        once: true,
      });
    }
  });
}

type TestFixtures = {
  disableAngularAnimations: void;
};

export const test = base.extend<TestFixtures>({
  disableAngularAnimations: [
    async ({ page }, use) => {
      await disableAnimations(page);
      await use();
    },
    { auto: true },
  ],
});

export { expect };
