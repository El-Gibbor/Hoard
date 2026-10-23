import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import type { FormError } from '../auth-slice';
import { signUp } from '../auth-slice';
import { useAppDispatch } from '../hooks';

export const SignUpPage = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<FormError | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    const result = await dispatch(signUp({ name, email, password }));
    setSubmitting(false);

    if (signUp.rejected.match(result)) {
      setError(result.payload ?? { message: 'Something went wrong. Try again.' });
      return;
    }

    navigate('/');
  };

  return (
    <main className="card">
      <h1>Sign up</h1>
      <p>Create an account to keep track of your MoMo and cash.</p>
      <form onSubmit={onSubmit} noValidate>
        {error?.message ? <p role="alert">{error.message}</p> : null}
        <label>
          Name
          <input
            type="text"
            name="name"
            autoComplete="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
          />
        </label>
        {error?.details?.name ? <p className="field-error">{error.details.name[0]}</p> : null}
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
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            minLength={8}
            required
          />
        </label>
        {error?.details?.password ? (
          <p className="field-error">{error.details.password[0]}</p>
        ) : null}
        <button type="submit" disabled={submitting}>
          Sign up
        </button>
      </form>
      <p>
        Already have an account? <Link to="/sign-in">Sign in</Link>
      </p>
    </main>
  );
};
