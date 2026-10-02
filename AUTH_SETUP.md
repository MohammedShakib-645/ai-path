# AI-PATH — Real Authentication Setup (Supabase)

The authentication system is **fully implemented** (real OAuth + real accounts +
real sessions + real password reset). It needs a Supabase project and provider
apps — nothing below is faked while unconfigured; the UI states that plainly.

## 1. Create the Supabase project

1. Create a free project at https://supabase.com/dashboard
2. **SQL Editor** → run `supabase/schema.sql`, then `supabase/auth-extras.sql`
3. Project Settings → API → copy:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (public by design; never add service_role)

```bash
# local
npx vercel env add NEXT_PUBLIC_SUPABASE_URL        # paste project URL
npx vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY   # paste anon key
# or put both in .env.local for `npm run dev`
```

Re-deploy after adding env vars (`npx vercel --prod`): NEXT_PUBLIC_* values are
inlined at build time.

## 2. Email/password

- **Authentication → Sign In / Providers → Email**: enabled (default)
- For instant demo sign-ups turn **Confirm email** OFF (otherwise users must
  click the confirmation link first — the UI says so honestly either way).
- **Authentication → Emails → Reset Password** template works out of the box;
  set **Site URL** to `https://ai-path-tutor.vercel.app` so reset links land
  correctly. Add `http://localhost:3000` to redirect URLs while developing.

## 3. Real Google login

1. Google Cloud Console → APIs & Services → Credentials → **OAuth client ID** (Web application)
   - Authorized redirect URI: `https://<PROJECT-REF>.supabase.co/auth/v1/callback`
2. Supabase → Authentication → Providers → **Google** → paste Client ID + Secret → Enable
3. Provider secrets live only inside Supabase — never in this codebase.

## 4. Real GitHub login

1. GitHub → Settings → Developer settings → **New OAuth App**
   - Homepage: `https://ai-path-tutor.vercel.app`
   - Callback: `https://<PROJECT-REF>.supabase.co/auth/v1/callback`
2. Supabase → Authentication → Providers → **GitHub** → paste Client ID + Secret → Enable

## 5. Account linking policy

Same email via a second provider attaches to the existing account only when the
provider reports the email as verified (Supabase `identity linking`); passwords
are never merged or exported. Duplicate sign-ups return an explicit
"account already exists" message.

## 6. Guest → account migration

- Local progress (`ai-path-progress-v3`) is **never deleted** on sign-up.
- On successful sign-up/sign-in the client uploads it to `user_progress`
  (RLS: only the owner can read/write).
- On a fresh device (empty local state) sign-in restores the stored copy.
- If `auth-extras.sql` was not run, cloud save reports
  "Cloud save isn't set up yet" — no fake success.

## 7. What each flow uses

| Flow | Mechanism |
|---|---|
| Continue with Google | Supabase OAuth → Google consent → `/api/auth/callback` sets httpOnly cookies |
| Continue with GitHub | Same, via GitHub |
| Create Account | `POST /api/auth/signup` (server validation, Supabase-hashed password) |
| Sign In | `POST /api/auth/signin` → session cookies (httpOnly, SameSite) |
| Forgot password | `POST /api/auth/forgot` → emailed single-use link → `/reset-password` → `updateUser` |
| Sessions | Middleware refreshes tokens; GET `/api/auth/session` returns profile only |
| Sign out | `POST /api/auth/signout` ends the session; device data stays |

## 8. Unconfigured behavior (honest, never fake)

Until step 1 + 3/4 are done the buttons/forms return explicit messages such as
"…isn't available on this deployment yet — the auth backend hasn't been
configured." Guest mode stays fully usable.

**Provider buttons:** Google/GitHub buttons render only when
`NEXT_PUBLIC_OAUTH_PROVIDERS` contains them (e.g. `google,github`). Once the
providers above are enabled in Supabase, set that env var on Vercel
(`npx vercel env add NEXT_PUBLIC_OAUTH_PROVIDERS production`) and redeploy —
the buttons appear with zero code changes. While empty, the auth screen shows
only working options (email/password + guest) — no dead buttons, no errors.
