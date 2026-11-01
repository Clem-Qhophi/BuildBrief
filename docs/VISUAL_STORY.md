# Landing-page visual story

> Historical implementation note: the photographic landing-page treatment was
> superseded after owner feedback on 2026-10-31. The current page leads with a
> saved evidence network and product/engineering views; the interactive scroll
> Atlas remains. See ADR-020 in `docs/DECISIONS.md`.

The owner asked for a scroll-controlled sequence of real-looking images that
explains the product, with fewer words in the opening viewport. Both pasted
transformation briefs were read. This implementation extends the working entry,
approval, verification, correction, and understanding flows built before this
request. It does not replace those flows with marketing mockups.

## Story and interactions

The same founder writes a request, reviews a finished-looking build, discovers
the missing expiry rule, and explains the corrected feature to a teammate.
One image sequence preserves identity, composition, room, and lighting. The
request, clock, gap, and handoff annotations remain HTML, so text is readable,
searchable, and independent of generated bitmap typography.

Scrolling advances or reverses the scene. Four chapter buttons jump to the
corresponding position without taking over the wheel. Keyboard scrolling works
normally. There is no timer or autoplay video. “Read without motion” presents
all four scenes as an ordinary sequence; reduced-motion preferences select that
view automatically. Without JavaScript, the complete static sequence remains.

The walkthrough is labeled as an illustration made with generated images. The
working reset-link example is a separate, real code execution path, linked
immediately after the story. No static annotation pretends to be a live verdict.

## Resources selected for this task

| Resource | Applied judgment | Runtime/install status |
| --- | --- | --- |
| [Anthropic frontend-design](https://github.com/anthropics/skills/tree/main/skills/frontend-design) | A subject-grounded photographic story; compact copy; one deliberate motion sequence | Consulted guidance; no upstream code copied |
| [Vercel React guidance](https://github.com/vercel-labs/agent-skills) | Preserve server-rendered entry links, isolate the interactive story, optimize images | Existing skill used; no new UI kit |
| [UI UX Pro Max](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) | Continuity, responsive framing, keyboard controls, reduced motion, image alternatives | Read upstream guidance; no installer executed |
| [shadcn/ui](https://ui.shadcn.com/docs/installation/next) | A component scaffold does not author this photographic narrative | Considered; not installed |
| [React Bits](https://github.com/DavidHDev/react-bits) | Use a bespoke sequence rather than add unrelated effects; its source uses MIT + Commons Clause | Considered; no source copied or package installed |
| [Motion](https://motion.dev/docs/react-scroll-animations) | Scroll position drives a small finite sequence with opacity and transform animation | Existing `motion@14.7.1` actively used |
| [Remotion skills](https://www.remotion.dev/docs/ai/skills) | Useful for a separately rendered promotional video; unnecessary for live scrolling | Evaluated; no video runtime installed or render claimed |

[R3F](https://r3f.docs.pmnd.rs/getting-started/introduction) and
[Rive](https://rive.app/docs/runtimes/react/react) were also checked. An authored
3D or `.riv` scene would be a separate media pipeline; neither is needed for this
photo-based experience. The earlier toolkit evaluation remains in ADR-016.

Generated image source files and the full prompt set:
[VISUAL_STORY_ASSETS.md](VISUAL_STORY_ASSETS.md). The built-in image tool generated
the base photograph and edited it into the remaining scenes. No API key setup,
external paid video service, or remote script execution was used.

## Visual critique and refinement

First desktop render: the centered opening delayed the first image too far.
Changed the hero into a compact headline/invitation composition so the image
sequence begins earlier. Reduced the homepage to this story, three genuine
entry paths, a short ownership section, and a collapsed FAQ.

First short-laptop story render: cover cropping cut off meaningful parts of the
photographs. On desktop the image now fits its stage with a quiet
annotation area beside it. The final handoff annotation moved away from the
founder's face. Full-height and narrow layouts are inspected separately.

Phone refinement removed a duplicated idea entry from the small-screen nav
(the primary idea action remains in the hero). The reading-mode control moved
into the persistent stage, and toggling modes returns to the start of the story.

Validation evidence and outstanding limits are recorded in PRODUCT_VALIDATION.md.
