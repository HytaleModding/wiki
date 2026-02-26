import {
  CheckCircleIcon,
  ClockIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import { Head, Link, useForm } from '@inertiajs/react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useFlashMessages } from '@/hooks/useFlashMessages';
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

export default function AcceptInvitation({ invitation }: Props) {
  useFlashMessages();
  const { post, processing } = useForm();

  const handleAccept = () => {
    post(`/invitations/${invitation.token}/accept`);
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-blue-100 text-blue-800';
      case 'editor':
        return 'bg-green-100 text-green-800';
      case 'viewer':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleDescription = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Can manage collaborators, create, edit, and delete pages';
      case 'editor':
        return 'Can create, edit, and publish pages';
      case 'viewer':
        return 'Can view private mod content';
      default:
        return '';
    }
  };

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
      <Head title={`Invitation to ${invitation.mod.name}`} />

      <div className="flex min-h-screen flex-col justify-center bg-gray-50 py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="text-center">
            <UserGroupIcon className="mx-auto h-12 w-12 text-blue-600" />
            <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
              You're invited!
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Join as a collaborator on a mod
            </p>
          </div>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-xl">
                {invitation.inviter.name} invited you to collaborate
              </CardTitle>
              <CardDescription>
                on <strong>{invitation.mod.name}</strong>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="rounded-lg bg-blue-50 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    Your Role:
                  </span>
                  <Badge className={getRoleColor(invitation.role)}>
                    {invitation.role.charAt(0).toUpperCase() +
                      invitation.role.slice(1)}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600">
                  {getRoleDescription(invitation.role)}
                </p>
              </div>

              <div className="rounded-lg bg-gray-50 p-4">
                <div className="mb-2 flex items-center text-sm text-gray-600">
                  <ClockIcon className="mr-2 h-4 w-4" />
                  Invitation expires: {formatDate(invitation.expires_at)}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <CheckCircleIcon className="mr-2 h-4 w-4" />
                  Invited by: {invitation.inviter.name} (@
                  {invitation.inviter.username})
                </div>
              </div>

              <div className="space-y-3">
                <Button
                  onClick={handleAccept}
                  disabled={processing}
                  className="w-full"
                  size="lg"
                >
                  {processing ? 'Accepting...' : 'Accept Invitation'}
                </Button>

                <Button variant="outline" asChild className="w-full" size="lg">
                  <Link href="/dashboard">Maybe Later</Link>
                </Button>
              </div>

              <div className="text-center">
                <p className="text-xs text-gray-500">
                  By accepting, you'll become a collaborator on{' '}
                  {invitation.mod.name} with {invitation.role} permissions.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
