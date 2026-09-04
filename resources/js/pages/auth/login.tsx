import { Form, Head, router } from '@inertiajs/react';
import { usePasskeyVerify } from '@laravel/passkeys/react';
import { KeyRound } from 'lucide-react';
import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import AuthLayout from '@/layouts/auth-layout';
import { register } from '@/routes';
import { store } from '@/routes/login';
import { request } from '@/routes/password';

type Props = {
  status?: string;
  canResetPassword: boolean;
  canRegister: boolean;
};

export default function Login({
  status,
  canResetPassword,
  canRegister,
}: Props) {
  const {
    verify,
    isLoading: passkeyProcessing,
    error: passkeyError,
    isSupported: passkeysSupported,
  } = usePasskeyVerify({
    onSuccess: ({ redirect }) => router.visit(redirect ?? '/dashboard'),
  });

  return (
    <AuthLayout
      title="Log in to your account"
      description="Enter your email and password below to log in"
    >
      <Head title="Log in" />

      {status && (
        <div className="mb-4 text-center text-sm font-medium text-green-600">
          {status}
        </div>
      )}

      <Form
        {...store.form()}
        resetOnSuccess={['password']}
        className="flex flex-col gap-6"
      >
        {({ processing, errors }) => (
          <>
            <div className="grid gap-6">
              <div className="grid gap-2">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  name="email"
                  required
                  autoFocus
                  tabIndex={1}
                  autoComplete="email webauthn"
                  placeholder="email@example.com"
                />
                <InputError message={errors.email} />
              </div>

              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                  {canResetPassword && (
                    <TextLink
                      href={request()}
                      className="ml-auto text-sm"
                      tabIndex={5}
                    >
                      Forgot password?
                    </TextLink>
                  )}
                </div>
                <Input
                  id="password"
                  type="password"
                  name="password"
                  required
                  tabIndex={2}
                  autoComplete="current-password"
                  placeholder="Password"
                />
                <InputError message={errors.password} />
              </div>

              <div className="flex items-center space-x-3">
                <Checkbox id="remember" name="remember" tabIndex={3} />
                <Label htmlFor="remember">Remember me</Label>
              </div>

              <Button
                type="submit"
                className="mt-4 w-full"
                tabIndex={4}
                disabled={processing}
                data-test="login-button"
              >
                {processing && <Spinner />}
                Log in
              </Button>
            </div>

            <div className="flex items-center gap-3 text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
              <span className="h-px flex-1 bg-border" />
              Or
              <span className="h-px flex-1 bg-border" />
            </div>

            <div className="space-y-3">
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="w-full"
                disabled={processing || !passkeysSupported || passkeyProcessing}
                onClick={() => void verify()}
                data-test="passkey-login-button"
              >
                {passkeyProcessing ? <Spinner /> : <KeyRound />}
                {passkeyProcessing
                  ? 'Waiting for your passkey…'
                  : 'Sign in with passkey'}
              </Button>

              {passkeyError && (
                <p
                  className="text-center text-sm text-destructive"
                  role="alert"
                >
                  {passkeyError}
                </p>
              )}

              {!passkeysSupported && (
                <p className="text-center text-xs text-muted-foreground">
                  Passkeys require a supported browser and a secure connection.
                </p>
              )}
            </div>

            {canRegister && (
              <div className="text-center text-sm text-muted-foreground">
                Don't have an account?{' '}
                <TextLink href={register()} tabIndex={5}>
                  Sign up
                </TextLink>
              </div>
            )}
          </>
        )}
      </Form>
    </AuthLayout>
  );
}
