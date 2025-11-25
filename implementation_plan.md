# Visual Enhancements for Stats Screen

## Goal
Improve the visual quality of the "Accuracy Trend" graph and "Heatmap" on the results screen to match the "Premium" and "High-Tech" aesthetic of the application.

## Proposed Changes

### 1. Accuracy Graph (`drawAccuracyGraph` in `js/main.js`)
- **Gradient Fill**: Add a semi-transparent gradient fill under the accuracy line to give it volume.
- **Glowing Line**: Add a shadow/glow effect to the line itself.
- **Grid & Axes**: Draw a subtle grid background and add labels for 0%, 50%, 100% accuracy.
- **Smoothing**: Use bezier curves (quadraticCurveTo) for a smoother line instead of jagged straight lines.
- **Points**: Draw small glowing dots at data points.

### 2. Heatmap (`drawHeatmap` in `js/main.js`)
- **Background**: Add a "radar" style background with concentric circles and crosshairs to emphasize the "targeting" theme.
- **Target Silhouette**: Improve the drawing style, possibly adding a "holographic" scanline effect to the target silhouette.
- **Hit/Miss Markers**:
    - **Hits**: Add a glow effect to the dots.
    - **Misses**: Make the 'X' marks more stylized with a glow.
- **Legend**: (Optional) Add a small legend for Head/Body/Miss if space permits, or just rely on intuitive colors.

## File Changes
- `js/main.js`: Update `drawAccuracyGraph` and `drawHeatmap` methods.

## Verification
- **Manual**: Visual inspection of the results screen after a game session.
