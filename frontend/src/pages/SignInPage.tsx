import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import type { FormError } from '../auth-slice';
import { signIn } from '../auth-slice';
import { useAppDispatch } from '../hooks';

export const SignInPage = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<FormError | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    const result = await dispatch(signIn({ email, password }));
    setSubmitting(false);

    if (signIn.rejected.match(result)) {
      setError(result.payload ?? { message: 'Something went wrong. Try again.' });
      return;
    }

    navigate('/');
  };

  return (
    <main className="card">
      <h1>Sign in</h1>
      <p>Use the email and password for your Hoard account.</p>
      <form onSubmit={onSubmit} noValidate>
        {error?.message ? <p role="alert">{error.message}</p> : null}
        <label>
          Email
          <input
            type="email"
            name="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>
        {error?.details?.email ? <p className="field-error">{error.details.email[0]}</p> : null}
        <label>
          Password
          <input
            type="password"
            name="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </label>
        {error?.details?.password ? (
          <p className="field-error">{error.details.password[0]}</p>
        ) : null}
        <button type="submit" disabled={submitting}>
          Sign in
        </button>
      </form>
      <p>
        Need an account? <Link to="/sign-up">Sign up</Link>
      </p>
    </main>
  );
};
