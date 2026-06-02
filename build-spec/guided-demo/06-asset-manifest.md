# Demo Asset Manifest

The exact visual assets the guided demo (`../guided-demo/`) needs, with specs, so they can be produced or sourced before the tour is built. These live under `public/tour/` in the prototype. Everything is static and deterministic (no live generation), matching the deterministic-demo principle. Assets are referenced by key from the tour script / overlay components, so a missing asset is caught by `tour-lint`, not at runtime.

Style direction (from [[ui-direction-decisions]]): the splash and cast use the tour-dark token set; clean, professional, our own identity (not Raphe's, not IBM's). No stock-photo clutter; calm and credible.

## 1. Persona avatars (the cast)

The cast screen and the per-step `PersonaIndicator` show a face + role + name per persona. Names are the real seeded users (`../seed/data/users.json`), so the switcher and SoD show real people. The tour foregrounds the nine personas on the golden path; the other internal roles still need an avatar for the role-switcher.

| Demo role (tour) | Seeded user | id | Avatar key | Used in chapter |
| --- | --- | --- | --- | --- |
| Requester | Aarav Shah (R&D/NPD) | U-REQ1 | `avatar/req1` | 1 |
| Approver | Marcus Cole (R&D/NPD mgr) | U-REQMGR1 | `avatar/reqmgr1` | 2 |
| Buyer (protagonist) | Mei Lin Tan (Procurement) | U-BUY2 | `avatar/buy2` | 3 |
| Supplier (external) | Synthex contact | (portal session) | `avatar/supplier-synthex` | 4 |
| Receiving | Lucas Fernandes | U-RECV1 | `avatar/recv1` | 5 |
| Quality | Sofia Marino (QA/QC) | U-QC1 | `avatar/qc1` | 5, 6 |
| Finance (Maker) | Omar Haddad / Ines Dubois | U-FINMK1 | `avatar/finmk1` | 7 |
| Finance (Checker) | Helena Brandt | U-FINCHK | `avatar/finchk` | 7 |
| Management | David Okonkwo | U-MGMT1 | `avatar/mgmt1` | 8 |

Plus role-switcher-only avatars (not on the golden path but selectable): Daniel Osei (Buyer), Anjali Verma (Proc mgr), Sam Whitfield / Lena Fischer (Finance approvers), Wei Zhang (Tax/Compliance), Tom Becker (Engineering/Maintenance), Riya Malhotra (Administrator), Grace Hollis (Management).

**Avatar spec:** square, 256x256 PNG (displayed at 32-48px in the indicator, larger on the cast screen), neutral professional headshots, consistent lighting/background so the cast screen reads as one set. Source options, in order of preference: (a) a licensed diverse-headshot set (one consistent style), (b) generated illustrated avatars (consistent flat-illustration style, lower risk than photos for a fictional company), (c) initials-in-a-colored-circle fallback (shadcn `Avatar` fallback) if imagery is not ready, so the tour is never blocked on art. The names are fixed; the faces can be upgraded later.

## 2. Title-screen visual

The dark hook screen (`TourTitleScreen`) carries a product visual beside the headline + storyline.

- **Key:** `splash/product-hero`.
- **Content:** a clean render of the management dashboard (the payoff screen, S12.1) shown on a device frame, the way the IBM splash showed its analytics screen on a laptop. It previews where the story ends.
- **Spec:** 1600x1000 PNG (or an SVG device-frame wrapping a screenshot), dark-background-friendly (transparent or dark matte), the dashboard legible at the splash size. Produced from the built dashboard once Phase 3 exists, or a high-fidelity mock of the hero sketch (`../ux/01-hero-screen-sketches.md` Hero 3) before then.
- **Fallback:** the headline + storyline alone on the dark background (no visual) if the render is not ready; the screen still works.

## 3. Cast-screen composition

- **Key:** `cast/composition` (or assembled from the avatars at runtime).
- **Content:** the nine golden-path personas arranged around a central "Meridian Consumer Health" node (the IBM cast pattern), each with avatar + role + name, plus the collaboration paragraph and "Let's begin".
- **Spec:** assembled in the component from the avatar set + the company name, so it is not a single baked image (keeps names/faces swappable). A central company mark (`brand/meridian-mark`) is a small logo/wordmark for Meridian: a simple wordmark in the brand accent, 400x120 PNG/SVG.

## 4. Picture-in-picture (PiP) previews

The cast screen and each chapter intro show a small PiP thumbnail of the upcoming screen (the IBM bottom-right preview).

- **Keys:** `pip/cast` (preview of Chapter 1's requisition screen), then `pip/ch1` ... `pip/ch8` (one per chapter, previewing that chapter's screen).
- **Spec:** 480x300 PNG screenshots of the actual screens, captured at the demo's pinned state (so the preview matches what the viewer is about to see). Captured from the built screens in Phase 3; before then, cropped mocks of the relevant hero sketch for the three marquee chapters and simple placeholders for the rest.
- **Determinism note:** capture against the freshly-reset seed state so the preview numbers match the live screen.

## 5. Closing-card visual (optional)

- **Key:** `splash/closing`.
- **Content:** a recap of the closed loop (the eight chapter icons in a ring, or the dashboard again) behind the "one purchase, seven people, one record" closing line and the Restart / Explore buttons.
- **Spec:** reuses the title visual or the chapter-rail iconography; optional, low priority.

## Production order and fallbacks

1. **Now (no art needed):** initials-fallback avatars, the Meridian wordmark, text-only splash and closing. The tour is fully functional with these; nothing blocks on imagery.
2. **Phase 3 (screens exist):** capture the real PiP screenshots and the product-hero dashboard render from the built screens at the reset state.
3. **Polish (before an investor showing):** upgrade the avatars to the consistent headshot/illustration set; finalize the splash render.

Every asset has a fallback so the demo runs at every stage; the art is an upgrade, not a dependency. `tour-lint` checks that every asset key referenced by the script resolves to either a file or a declared fallback.

## Asset key registry (for `tour-lint`)

`avatar/{role}` (x ~20 personas), `splash/product-hero`, `splash/closing`, `brand/meridian-mark`, `cast/composition`, `pip/cast`, `pip/ch1`..`pip/ch8`. The registry lives alongside `lib/tour/anchors.ts` so the lint can assert coverage.
