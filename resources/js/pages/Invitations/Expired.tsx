import {
  ExclamationTriangleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
}

export default function ExpiredInvitation({ invitation }: Props) {
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <AppLayout>
      <Head title="Invitation Expired" />

      <div className="flex min-h-screen flex-col justify-center bg-gray-50 py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="text-center">
            <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-600" />
            <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
              Invitation Expired
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              This invitation is no longer valid
            </p>
          </div>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-xl text-red-700">
                Unable to Accept Invitation
              </CardTitle>
              <CardDescription>
                The invitation to collaborate on{' '}
                <strong>{invitation.mod.name}</strong> has expired
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="rounded-lg bg-red-50 p-4">
                <div className="mb-2 flex items-center text-sm text-red-700">
                  <ClockIcon className="mr-2 h-4 w-4" />
                  Expired on: {formatDate(invitation.expires_at)}
                </div>
                <p className="text-sm text-red-600">
                  Invitations are valid for 7 days from when they're sent.
                </p>
              </div>

              <div className="rounded-lg bg-gray-50 p-4">
                <h4 className="mb-2 font-medium text-gray-900">
                  What can you do?
                </h4>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>
                    • Contact {invitation.inviter.name} (@
                    {invitation.inviter.username}) to request a new invitation
                  </li>
                  <li>• Check if you have other pending invitations</li>
                  <li>
                    • Visit the mod page to see if it's publicly accessible
                  </li>
                </ul>
              </div>

              <div className="space-y-3">
                <Button asChild className="w-full" size="lg">
                  <Link href="/dashboard">Go to Dashboard</Link>
                </Button>

                <Button variant="outline" asChild className="w-full" size="lg">
                  <Link href={`/docs/${invitation.mod.slug}`}>
                    View Mod (if public)
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
