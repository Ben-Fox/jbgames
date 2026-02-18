# Fivefold Code Review

## Critical Bugs

### 1. ❌ LINCOLN is NOT a "Famous Willie" (Data Error)
- **Location**: `NEXUS_POOL[2]`, group "Famous Willies"
- **Issue**: Abraham Lincoln's first name is Abraham, not Willie/William. WONKA (Willy), NELSON (Willie), SHAKESPEARE (William) are correct. LINCOLN is wrong.
- **Fix**: Replace LINCOLN with SHATNER (William Shatner).

### 2. ❌ Mimic Letter Coloring Doesn't Handle Duplicate Letters (Logic Bug)
- **Location**: `renderGuessRow()` in Mimic game
- **Issue**: Uses simple `word.includes(g)` to mark letters gold (present). This doesn't account for letter frequency. Example: word is "CRANE", guess "CREEP" — both E's would show gold, but CRANE only has one E. The standard Wordle algorithm counts remaining letter occurrences.
- **Fix**: Implement proper frequency-aware coloring (green pass first, then gold pass with remaining counts).

### 3. ❌ Chronicle Unused Variable
- **Location**: `startRound()` in Chronicle
- **Issue**: `correctOrder` is computed (`puzzle.events.slice(0, roundIdx + 2)`) but never referenced. Dead code.
- **Fix**: Remove it.

## Minor Issues / Design Notes

### 4. ⚠️ Chronicle Rounds 3–4 Are Identical Difficulty
- Rounds use `Math.min(roundIdx + 3, 5)` events. Rounds 0→3, 1→4, 2→5, 3→5, 4→5. Last three rounds all use 5 events (just different shuffles). Not a bug per se but repetitive.
- **Left as-is** — different shuffle seeds make them distinct puzzles.

### 5. ⚠️ Cipher Substitution Can Map a Letter to Itself
- The random shuffle doesn't guarantee derangement. A letter could encode to itself. This is uncommon but possible.
- **Left as-is** — doesn't break solvability.

### 6. ⚠️ `toSort.sort()` Mutates Array In-Place (Chronicle)
- When showing the correct answer after failing, `toSort.sort((a,b)=>a.year-b.year)` mutates the reference array. Since a `setTimeout` immediately transitions to the next round, this has no practical impact.
- **Left as-is**.

## Verified Working ✓

- **Week rotation**: `getWeekIndex()` correctly cycles through pools using epoch-based week math.
- **Progress save/load**: Uses try/catch for `JSON.parse`, week-specific keys. Solid.
- **Nexus loss reveal**: `prog.solved = [0,1,2,3]` correctly reveals all groups on 4th mistake.
- **Cipher encoding/decoding**: `makeCipher()` builds proper bidirectional maps. `isComplete()` validates every character. Works end-to-end.
- **Wavelength scoring**: Tolerance zones (0.33/0.66/1.0) map to 3/2/1/0 points correctly.
- **All 5 games render and complete**: Hub → Game → Rounds → Result banner → Back to hub. No null refs or undefined vars.
- **CSS/Mobile**: Responsive grid, 2-col nexus on mobile, keyboard reflows. No overflow issues found.
- **Famous Maries**: Curie ✓, Kondo ✓, Antoinette ✓, Shelley ✓.
- **localStorage edge cases**: Empty input rejected in Mimic (length check). Progress defaults to fresh state on parse failure.
