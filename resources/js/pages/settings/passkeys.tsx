import { Head, router } from '@inertiajs/react';
import { usePasskeyRegister } from '@laravel/passkeys/react';
import { KeyRound, Laptop, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import Heading from '@/components/heading';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import type { BreadcrumbItem } from '@/types';

type Passkey = {
  id: number;
  name: string;
  authenticator: string | null;
  created_at: string;
  last_used_at: string | null;
};

type Props = {
  passkeys: Passkey[];
  status?: string;
};

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Passkeys',
    href: '/settings/passkeys',
  },
];

function formatDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export default function Passkeys({ passkeys, status }: Props) {
  const [name, setName] = useState('');
  const [notice, setNotice] = useState<string | null>(
    status === 'passkey-deleted' ? 'Passkey removed.' : null,
  );
  const { register, isLoading, error, isSupported } = usePasskeyRegister({
    onSuccess: () => {
      setName('');
      setNotice('Passkey added. You can now use it to sign in.');
      router.reload({ only: ['passkeys'] });
    },
  });

  const removePasskey = (passkey: Passkey) => {
    if (!window.confirm(`Remove “${passkey.name}” from your account?`)) {
      return;
    }

    router.delete(`/user/passkeys/${passkey.id}`, {
      preserveScroll: true,
      onSuccess: () => setNotice('Passkey removed.'),
    });
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Passkeys" />

      <h1 className="sr-only">Passkey settings</h1>

      <SettingsLayout>
        <div className="space-y-6">
          <Heading
            variant="small"
            title="Passkeys"
            description="Sign in without a password using your device or a security key"
          />

          {notice && (
            <div
              className="rounded-lg border border-green-500/20 bg-green-500/10 px-3 py-2.5 text-sm font-medium text-green-700 dark:text-green-400"
              role="status"
            >
              {notice}
            </div>
          )}

          <div className="space-y-3">
            <Label htmlFor="passkey-name">Passkey name</Label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                id="passkey-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="e.g. Personal laptop"
                maxLength={255}
                disabled={isLoading}
              />
              <Button
                type="button"
                className="shrink-0"
                disabled={!isSupported || isLoading || !name.trim()}
                onClick={() => void register(name.trim())}
                data-test="add-passkey-button"
              >
                {isLoading ? <Spinner /> : <Plus />}
                {isLoading ? 'Waiting…' : 'Add passkey'}
              </Button>
            </div>

            {error && (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            )}

            {!isSupported && (
              <p className="text-sm text-muted-foreground">
                This browser does not support passkeys. Try a current browser
                over HTTPS, or use localhost while developing.
              </p>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <Heading
            variant="small"
            title="Your passkeys"
            description="Passkeys already connected to this account"
          />

          {passkeys.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-6 text-center">
              <Laptop className="mx-auto mb-3 size-6 text-muted-foreground" />
              <p className="text-sm font-medium">No passkeys yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Add one above for faster, passwordless sign-in.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border overflow-hidden rounded-xl border border-border">
              {passkeys.map((passkey) => (
                <div
                  key={passkey.id}
                  className="flex items-start justify-between gap-4 p-4"
                >
                  <div className="flex min-w-0 gap-3">
                    <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                      <KeyRound className="size-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-medium">
                          {passkey.name}
                        </p>
                        {passkey.authenticator && (
                          <Badge variant="secondary">
                            {passkey.authenticator}
                          </Badge>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Added {formatDate(passkey.created_at)}
                        {passkey.last_used_at && (
                          <> · Last used {formatDate(passkey.last_used_at)}</>
                        )}
                      </p>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={() => removePasskey(passkey)}
                    aria-label={`Remove ${passkey.name}`}
                  >
                    <Trash2 />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </SettingsLayout>
    </AppLayout>
  );
}
