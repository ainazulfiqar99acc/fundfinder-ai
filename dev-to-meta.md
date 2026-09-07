# dev.to publishing notes

Everything here goes in the editor's fields — NOT in the post body.
The body is `dev-to-post.md`: open it, select all, paste. It is already
clean (no comments) and every image URL resolves.

## Title

Recommended:

    I told Gemini to search the web. It said yes, and didn't.

Alternates:

    Three of four Gemini models accepted the search tool and never ran it
    The grant did not exist. Neither did the foundation.

## Tags

    devchallenge, weekendchallenge, googleai, ai

## Cover image

1000x420, uploaded via the editor sidebar. Prompt for Gemini:

    A wide cinematic banner, 1000x420, 2.4:1 aspect ratio.

    A row of four official-looking foundation office doors along a quiet
    corridor, each with a polished brass nameplate. Three doors are solid,
    real, casting soft shadows. The fourth door is revealed as a flat
    painted stage flat, propped from behind with a wooden brace, with empty
    darkness where the room should be.

    Muted institutional palette — warm grey walls, aged wood, brass — with a
    single deep emerald accent on the one real door handle nearest the
    viewer. Soft directional light from the left, long shadows, shallow
    depth of field, photographic realism, slightly desaturated.

    No text, no letters, no words, no numbers, no logos anywhere in the
    image. Nameplates must be blank polished metal.

Image models garble lettering, so the "no text" instruction matters — a
cover with mangled pseudo-words undercuts a post about things that look
real and are not.

## Before publishing

1. `{% github ainazulfiqar99acc/fundfinder-ai %}` must sit on its own line.
   The editor sometimes merges a liquid tag into the paragraph above it.
2. Hit Preview and confirm all three images render.
3. Deadline: 7 Sept 2026, 06:59 UTC.

## Images in the post

| # | File | Where |
|---|------|-------|
| 1 | `media/fundfinder-demo.gif` | Demo, under the live link |
| 2 | `media/04-link-caught.png` | Demo, under the results block |
| 3 | `media/06-loi-modal.png` | Demo, near the end |

All three are committed and served from
`https://raw.githubusercontent.com/ainazulfiqar99acc/fundfinder-ai/main/media/`.
To swap the hero gif, replace the file under that name and re-push — the
post needs no edit.
