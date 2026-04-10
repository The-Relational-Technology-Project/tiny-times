

# Print-First Redesign + Generate Coloring Images

## Problems Identified

From the PDF print output:
1. **Too much ink** — colored background boxes on every story, weather strip, events/fact/activity cards all have background fills
2. **Content bleeds** — page 1 content overflows past the page break (visible in the PDF where the coloring page header is tiny and squished)
3. **Not print-optimized** — looks like a screen app, not a newspaper
4. **No coloring images** — page 2 is empty placeholder

## Plan

### 1. Redesign Newspaper Layout for Print

**Remove colored background boxes.** Replace with:
- Simple thin separator lines between sections
- Category labels in color text only (no filled header bars)
- Headlines in color, body text in black
- Remove `rounded-xl`, `border-2`, and `background` fills from StoryBlock and bottom cards
- Weather strip: just text with emoji, no background box
- Events/Fun Fact/Activity: separated by thin rules, no background fills

**Result:** Mostly black text with color accents on headings and icons. Prints cleanly in B&W because color is only on non-essential decorative elements.

**More spacious layout:**
- Increase vertical spacing between sections (mt-3 → mt-5)
- Add breathing room in the masthead area
- Stories get more line-height and padding

### 2. Fix Page Break / Bleed

**Root cause:** Page 1 content uses `min-height: 11in` on screen but the print CSS sets `max-height: 10.4in` with `overflow: hidden`. Content is too tall.

**Fix:**
- Set page 1 to exactly `height: 10.15in` (letter minus margins) in print, with `overflow: hidden`
- Remove `min-height: 11in` from print
- On screen, keep the current sizing but cap visible content
- Ensure page 2 starts fresh after the break

### 3. Generate 5 Coloring Page Images with Lovable AI

Use `google/gemini-3.1-flash-image-preview` to generate 5 kid-friendly coloring page images:
- Simple black outlines on white background, no color fill
- Subjects: a cat playing, a rocket in space, fish in the ocean, a tree with birds, a butterfly garden
- Upload each to the `illustrations` storage bucket
- Insert metadata rows into the `illustrations` table with appropriate tags
- These will display on page 2 during demos

### 4. Files to Modify

| File | Changes |
|------|---------|
| `src/components/Newspaper.tsx` | Remove background fills from StoryBlock. Remove colored boxes from events/fact/activity. Use thin separators instead. Simplify weather strip. |
| `src/index.css` | Fix print page heights to prevent bleed. Set exact page dimensions. |

### 5. Script for Coloring Images

Run a script that:
1. Calls Lovable AI image generation for 5 coloring pages
2. Uploads PNGs to the `illustrations` bucket
3. Inserts rows into the `illustrations` table

