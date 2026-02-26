import { Head, Link } from '@inertiajs/react';
import { UserIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';

interface User {
  id: number;
  name: string;
  username: string;
  email: string;
}

interface Mod {
  id: string;
  name: string;
  slug: string;
  description: string;
}

interface Invitation {
  id: number;
  role: string;
  token: string;
  expires_at: string;
  user: User;
  mod: Mod;
  inviter: User;
}

interface Props {
  invitation: Invitation;
  needsLogin: boolean;
  wrongUser: boolean;
}

export default function LoginRequired({ invitation, needsLogin, wrongUser }: Props) {
  return (
    <AppLayout>
      <Head title="Login Required" />

      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="text-center">
            <UserIcon className="mx-auto h-12 w-12 text-blue-600" />
            <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
              {needsLogin ? 'Login Required' : 'Account Mismatch'}
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              {needsLogin
                ? 'Please log in to accept this invitation'
                : 'This invitation is for a different user'
              }
            </p>
          </div>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-xl">
                Invitation to {invitation.mod.name}
              </CardTitle>
              <CardDescription>
                From {invitation.inviter.name} (@{invitation.inviter.username})
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {needsLogin ? (
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-sm text-blue-700">
                    This invitation is for <strong>{invitation.user.email}</strong>.
                    Please log in with this account to accept the invitation.
                  </p>
                </div>
              ) : (
                <div className="bg-yellow-50 rounded-lg p-4">
                  <div className="flex items-start">
                    <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mr-2 mt-0.5" />
                    <div>
                      <p className="text-sm text-yellow-800 font-medium">Account Mismatch</p>
                      <p className="text-sm text-yellow-700 mt-1">
                        This invitation is for <strong>{invitation.user.email}</strong>,
                        but you're logged in as a different user.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Invitation Details:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• <strong>Mod:</strong> {invitation.mod.name}</li>
                  <li>• <strong>Role:</strong> {invitation.role.charAt(0).toUpperCase() + invitation.role.slice(1)}</li>
                  <li>• <strong>Invited by:</strong> {invitation.inviter.name}</li>
                </ul>
              </div>

              <div className="space-y-3">
                {needsLogin ? (
                  <>
                    <Button
                      asChild
                      className="w-full"
                      size="lg"
                    >
                      <Link href={`/login?intended=/invitations/${invitation.token}`}>
                        Login to Accept
                      </Link>
                    </Button>

                    <Button
                      variant="outline"
                      asChild
                      className="w-full"
                      size="lg"
                    >
                      <Link href="/register">
                        Don't have an account? Register
                      </Link>
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      asChild
                      className="w-full"
                      size="lg"
                    >
                      <Link href="/logout" method="post">
                        Logout and Login as {invitation.user.email}
                      </Link>
                    </Button>

                    <Button
                      variant="outline"
                      asChild
                      className="w-full"
                      size="lg"
                    >
                      <Link href="/dashboard">
                        Go to Dashboard
                      </Link>
                    </Button>
                  </>
                )}
              </div>

              <div className="text-center">
                <p className="text-xs text-gray-500">
                  If you believe this is an error, please contact {invitation.inviter.name}.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
