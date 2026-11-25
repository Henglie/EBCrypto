# UI motion contract

The current application UI is the implementation source. The separate UI replica does not replace it. Algorithm modules must remain usable without UI, animation, icon or display-font dependencies. Shared UI receives business values and callbacks from its caller; visual preferences do not change computation, cancellation, timeouts or output identity.

## Component ownership

- Buttons, inputs, tabs and menu items use semantic elements, the shared state-layer tokens and visible keyboard focus. Press feedback must not move the hit target, distort text or add ripples.
- Anchored menus and panels call `enterSurface(node, distance)` and `exitSurface(node, complete)`. The runtime samples the displayed frame before cancelling an old timeline. A superseded completion cannot close a reopened component. Exit immediately makes the component inert; the completion removes or hides it.
- Modal roots call `attachModalLifecycle(root, { dialog, onClose, initialFocus, restoreFocusTo })` after mounting. All close paths use `closeModalSurface(root, complete)`. The backdrop and dialog have paired timelines. Disposal that would blank the exiting UI runs in the completion; computation cancellation and resource cancellation happen immediately. Background inert ownership is reference-counted, and an older dialog cannot steal focus from a newer one.
- Small disclosures use `setDisclosure(node, expanded)`, including node-library categories. Native `details` are enhanced through the shared delegated summary handler, without wrapping or rewriting their content. Use `data-motion="native"` only when another documented controller owns that disclosure. Closing content cannot receive focus. Large content fades instead of animating thousands of pixels of height.
- Segmented controls use `sharedControls.js`. Navigation drawers retain their paired CSS transitions. A page transition remains a short opacity-only reveal, without translation, scale or stagger.
- Direct manipulation follows the pointer immediately: text selection, scrollbar position, splitters, canvas pan/zoom, crop handles, node dragging and file bytes must not lag behind an ornamental easing curve. State changes around these operations still use the shared controls.

## Timing and interruption

`expressiveMotion.js` owns the default 200 ms entry/disclosure, 150 ms exit and nonlinear curves; `motionPreferences.js` scales cadence to 0.75 / 1 / 1.25. `expressive.css` owns state-layer tokens. Fast reversal uses the current displayed frame and the remaining distance. The runtime guarantees position/opacity continuity; this is not a claim that every animation preserves physical velocity. The spring controller preserves velocity where it already owns the segmented indicator.

Reduced motion finishes the latest intended state and cleanup immediately. Changing the preference mid-exit, losing visibility, route disposal, pointer cancellation and repeated activation must leave no invisible interactive layer or stale completion. Browser/OS-owned file pickers and select popups retain platform behavior.

## New-component checklist

1. Assign one motion owner and add the module to `tools/ui_motion_contract.json`. New pages reuse the components; do not animate every added DOM node with a global observer.
2. Exercise enter → close → reopen before completion, repeated activation, both keyboard and pointer, focus return, route change and reduced motion mid-animation.
3. Record actual browser timing/keyframes and check intermediate frames. Verify 390 px and desktop layouts, light/dark appearance and both maintained interface languages.
4. Verify business output separately. A successful animation does not prove that computation, downloading or cancellation works.

Run `node tools/component_motion_check.mjs` for source ownership and `node tools/motion_check.mjs` for the spring controller. Source ownership is a gate for future modules, not proof of complete visual acceptance. Keep real-browser component evidence alongside each implementation task.
