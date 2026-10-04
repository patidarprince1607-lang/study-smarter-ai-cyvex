<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture rules
- All AI calls go to Gemma 4 via the Gemini API from server-only `src/lib/gemma.server.ts`, exposed through server functions in `src/lib/learn.functions.ts` — keeps GEMINI_API_KEY off the client.
- Lesson generation runs two parallel Gemma calls (content + structure) — halves wait time for the demo.
- The pre-written sample lesson must always be labelled as a sample, never as a Gemma response.
