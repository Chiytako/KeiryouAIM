# Walkthrough - UI Layering Fix

## Problem
When opening the settings menu during the countdown phase (via the pause menu), the countdown overlay (numbers 3, 2, 1) would appear on top of the settings menu, making it difficult to interact with or view the settings.

## Cause
Both `.settings-menu` and `.countdown-overlay` had the same `z-index` of `2000`. Since the countdown overlay is defined later in the HTML structure, it was rendered on top of the settings menu when both were visible.

## Solution
Increased the `z-index` of `.settings-menu` in `css/menu.css` from `2000` to `2500`.

## Changes

### css/menu.css

```css
.settings-menu {
    /* ... */
    z-index: 2500; /* Increased from 2000 */
}
```

## Verification
1. Start a game mode (e.g., Gridshot).
2. During the countdown (3, 2, 1), press ESC to pause.
3. Click "Settings" in the pause menu.
4. Verify that the settings menu is fully visible and not obstructed by the countdown number.
