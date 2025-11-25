# Stats Visualization Enhancements

## Changes

### 1. Accuracy Graph (`drawAccuracyGraph`)
- **Visuals**:
    - Added a semi-transparent gradient fill under the line (`rgba(0, 255, 204, 0.5)` to transparent).
    - Added a glowing effect to the line (`shadowBlur`).
    - Smoothed the line using Bezier curves (`quadraticCurveTo`).
    - Added a grid background with axis labels (0%, 25%, 50%, 75%, 100%).
    - Improved "NO DATA" display with a tech-style font.

### 2. Heatmap (`drawHeatmap`)
- **Visuals**:
    - Added a "radar" style background with concentric circles and crosshairs.
    - Improved target silhouette with a "holographic" scanline effect and semi-transparent fill.
    - **Hit Markers**:
        - Headshots: Yellow with glow.
        - Bodyshots: Cyan with glow.
        - Misses: Red 'X' with glow.
    - Added "NO DATA" display.

## Verification Results

### Manual Verification Steps
1.  **Play a Game**: Complete a session in any mode (e.g., Gridshot).
2.  **Check Results Screen**:
    - **Accuracy Graph**: Confirm the line is smooth, glowing, and has a gradient fill. Check that grid lines and labels are visible.
    - **Heatmap**: Confirm the radar background is visible. Check that the target silhouette looks "holographic". Verify that hits and misses are glowing and clearly distinguishable.
