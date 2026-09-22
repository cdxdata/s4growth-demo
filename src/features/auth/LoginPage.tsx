import { useLogin } from "@/features/auth/useLogin";

export function LoginPage() {
  const summary = useLogin();

  return (
    <div className="login-shell">
      <section className="login-panel">
        <div className="login-brand">
          <div className="mark">S4</div>
          <div>
            <strong>Steps4Growth</strong>
            <small>North Carolina reporting center</small>
          </div>
        </div>
        <h1>Sign in without a password</h1>
        <p className="login-lead">
          Enter an approved email. If it is on the access list, we send a one-time link to that inbox.
        </p>
        {summary.isVerifying ? <div className="notice">Opening your workspace…</div> : null}
        {summary.error ? <div className="notice error">{summary.error}</div> : null}
        <form className="login-form" onSubmit={summary.submit}>
          <label htmlFor="login-email">Work email</label>
          <input
            id="login-email"
            type="email"
            autoComplete="email"
            required
            value={summary.email}
            onChange={(event) => summary.setEmail(event.target.value)}
            placeholder="you@organization.org"
          />
          <button className="btn primary" type="submit" disabled={summary.isSending}>
            {summary.isSending ? "Sending link…" : "Email me a sign-in link"}
          </button>
        </form>
        {summary.preview ? (
          <div className="magic-mail">
            <div className="magic-mail-kicker">Simulated inbox</div>
            <div className="magic-mail-meta">To {summary.preview.email}</div>
            <h2>Your Steps4Growth sign-in link</h2>
            <p>
              Hello {summary.preview.recipientName}. Use this one-time link to open the{" "}
              {summary.preview.organizationName} workspace.
            </p>
            <button className="btn primary" type="button" onClick={summary.openLink} disabled={summary.isVerifying}>
              Continue to Steps4Growth
            </button>
          </div>
        ) : (
          <div className="login-hint">
            <div className="login-hint-label">Demo accounts</div>
            <code>admin@tester.com</code>
            <code>manager@tester.com</code>
            <code>tp@tester.com</code>
            <code>backbone@tester.com</code>
            <code>liaison@tester.com</code>
          </div>
        )}
      </section>
      <aside className="login-hero">
        <img
          src="/login-hero.jpg"
          alt="The Blue Ridge Parkway climbing around Grandfather Mountain in Avery County, North Carolina"
        />
        <div className="login-hero-copy">
          <p className="login-hero-kicker">Steps for growth</p>
          <h2>A rising road through North Carolina’s Blue Ridge</h2>
          <p>
            Public-domain photograph by Ken Thomas, 2008. Linn Cove Viaduct at Mile Marker 304, Blue Ridge Parkway —
            a working landscape of mountain communities, travel, and upward progress.
          </p>
        </div>
      </aside>
    </div>
  );
}
