# Post-Review Fixes Report

All 4 issues requested in the fixes brief have been resolved successfully.

## Fixes Summary

### 1. Notes Discarded on Empty Cells
- **File**: [note.ts](file:///Users/richardluo/Developer/QRoll/src/pages/api/attendance/note.ts)
- **Fix**: When an admin enters a note on a cell that does not have an existing attendance record (meaning status is `'none'`), the status is promoted to `'absent'` to ensure the row is inserted in the database and the note is not discarded.

### 2. Legacy API Update Overwriting Status
- **File**: [note.ts](file:///Users/richardluo/Developer/QRoll/src/pages/api/attendance/note.ts)
- **Fix**: Re-structured payload handling so that status is only updated or inserted when it is explicitly provided (and not `'none'`). Updating notes alone will no longer overwrite or revert existing status values to `'present'`.

### 3. Invite Admin for Existing User
- **File**: [users.astro](file:///Users/richardluo/Developer/QRoll/src/pages/admin/users.astro)
- **Fix**: When sending an admin invite to an email address that already has a profile registered in the `profiles` table, the user is immediately promoted to the `'admin'` role, and a success message is displayed. If no profile exists, the email is added to the `admin_invites` table as before.

### 4. Accessibility: Color Contrast on Selected Late Button
- **File**: [AttendanceMatrix.tsx](file:///Users/richardluo/Developer/QRoll/src/components/AttendanceMatrix.tsx)
- **Fix**: Changed the text color styling of the active Late button override in the cell editor from `text-amber-700` to `text-amber-950`. This increases the contrast against the `bg-amber-50` background to satisfy the WCAG AA minimum contrast ratio of 4.5:1.

---

## Verification
- Ran `npm run test` and all 22 tests across 5 test suites passed.
- Ran `npx astro check` and verified the build builds with 0 errors and 0 warnings.
