import { Transition } from '@headlessui/react';
import { Form, Head, Link, usePage, router } from '@inertiajs/react';
import { Camera, Trash2 } from 'lucide-react';
import { useRef, useState } from 'react';
import ProfileController from '@/actions/App/Http/Controllers/Settings/ProfileController';
import DeleteUser from '@/components/delete-user';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { edit } from '@/routes/profile';
import { send } from '@/routes/verification';
import type { BreadcrumbItem, SharedData } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Profile settings',
    href: edit().url,
  },
];

function UserAvatar({
  src,
  name,
  size = 80,
}: {
  src?: string | null;
  name: string;
  size?: number;
}) {
  const fallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=${size * 2}&background=random`;

  return (
    <img
      src={src ?? fallback}
      alt={name}
      width={size}
      height={size}
      onError={(e) => {
        (e.currentTarget as HTMLImageElement).src = fallback;
      }}
      className="rounded-full object-cover"
      style={{ width: size, height: size }}
    />
  );
}

export default function Profile({
  mustVerifyEmail,
  status,
}: {
  mustVerifyEmail: boolean;
  status?: string;
}) {
  const { auth } = usePage<SharedData>().props;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      console.log('changing avatar');

      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string);
        console.log('avatar preview updated: ', e.target?.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleDeleteAvatar = () => {
    if (auth.user.avatar && !auth.user.avatar.includes('ui-avatars.com')) {
      router.delete('/settings/profile/avatar', {
        preserveScroll: true,
      });
    }
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Profile settings" />

      <h1 className="sr-only">Profile Settings</h1>

      <SettingsLayout>
        <div className="space-y-6">
          <Heading
            variant="small"
            title="Profile information"
            description="Update your name and email address"
          />

          <Form
            {...ProfileController.update.form()}
            options={{
              preserveScroll: true,
            }}
            className="space-y-6"
          >
            {({ processing, recentlySuccessful, errors }) => {
              if (recentlySuccessful) {
                setAvatarPreview(null);
              }

              return (
                <>
                  <div className="grid gap-4">
                    <Label>Profile Picture</Label>
                    <div className="flex items-center gap-4">
                      <UserAvatar
                        src={avatarPreview ?? auth.user.avatar}
                        name={auth.user.name}
                        size={80}
                      />
                      <div className="flex flex-col gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={triggerFileInput}
                          className="flex items-center gap-2"
                        >
                          <Camera className="h-4 w-4" />
                          Upload Photo
                        </Button>
                        {auth.user.avatar &&
                          !auth.user.avatar.includes('ui-avatars.com') && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={handleDeleteAvatar}
                              className="flex items-center gap-2 text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                              Remove Photo
                            </Button>
                          )}
                        <p className="text-xs text-muted-foreground">
                          JPG, PNG, GIF or WebP. Max 2MB.
                        </p>
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        name="avatar"
                        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                        onChange={handleAvatarChange}
                        className="hidden"
                      />
                    </div>
                    <InputError className="mt-2" message={errors.avatar} />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="name">Name</Label>

                    <Input
                      id="name"
                      className="mt-1 block w-full"
                      defaultValue={auth.user.name}
                      name="name"
                      required
                      autoComplete="name"
                      placeholder="Full name"
                    />

                    <InputError className="mt-2" message={errors.name} />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="email">Email address</Label>

                    <Input
                      id="email"
                      type="email"
                      className="mt-1 block w-full"
                      defaultValue={auth.user.email}
                      name="email"
                      required
                      autoComplete="username"
                      placeholder="Email address"
                    />

                    <InputError className="mt-2" message={errors.email} />
                  </div>

                  {mustVerifyEmail && auth.user.email_verified_at === null && (
                    <div>
                      <p className="-mt-4 text-sm text-muted-foreground">
                        Your email address is unverified.{' '}
                        <Link
                          href={send()}
                          as="button"
                          className="text-foreground underline decoration-neutral-300 underline-offset-4 transition-colors duration-300 ease-out hover:decoration-current! dark:decoration-neutral-500"
                        >
                          Click here to resend the verification email.
                        </Link>
                      </p>

                      {status === 'verification-link-sent' && (
                        <div className="mt-2 text-sm font-medium text-green-600">
                          A new verification link has been sent to your email
                          address.
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex items-center gap-4">
                    <Button
                      disabled={processing}
                      data-test="update-profile-button"
                    >
                      Save
                    </Button>

                    <Transition
                      show={recentlySuccessful}
                      enter="transition ease-in-out"
                      enterFrom="opacity-0"
                      leave="transition ease-in-out"
                      leaveTo="opacity-0"
                    >
                      <p className="text-sm text-neutral-600">Saved</p>
                    </Transition>
                  </div>
                </>
              );
            }}
          </Form>
        </div>

        <DeleteUser />
      </SettingsLayout>
    </AppLayout>
  );
}
