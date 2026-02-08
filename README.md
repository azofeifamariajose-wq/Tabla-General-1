
<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1zj4QhpIYNWFmnGK41c2GfOBDTTu17Hm8

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Validation Guarantees & N/A Policy

The extraction pipeline now enforces strict deterministic validation after **Audit**, after **QA**, and immediately before **Export**.

- Required fields that are empty (`""`, `null`, `undefined`) are invalid and are forced to `"N/A"` until targeted re-check resolves them.
- If source evidence is not found, output must be exactly `"N/A"` (never inferred).
- Group-dependent fields are forced to `"N/A"` when the comparative group does not exist in the source.
- Option answers must match schema options exactly (case and spacing).
- Duplicates are invalid (`one question -> one answer`).
- Final ordering must match schema order; misordered payloads fail validation.
- Every non-`"N/A"` answer must include trace evidence (`page_number` + excerpt in reasoning). If trace is missing, answer is converted to `"N/A"`.
- Export is blocked when unresolved validation issues remain; a structured error report is emitted with question key, current answer, invalid reason, and required re-check step.

Run deterministic validation tests with:

- `npm run test:validation`
