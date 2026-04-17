/**
 * Skip-to-main-content link for keyboard users.
 *
 * Hidden by default, visually revealed on keyboard focus (screen-reader-only
 * class pattern — visually-hidden but focusable). Appears fixed in the
 * top-left on focus so it stacks above the nav chrome.
 *
 * Consumers should ensure their <main> element has id="main-content".
 */
export function SkipLink() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-[1000] focus:rounded-md focus:bg-accent focus:px-3 focus:py-2 focus:text-xs focus:font-semibold focus:text-accent-foreground focus:shadow-md focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-base"
    >
      Skip to main content
    </a>
  );
}
