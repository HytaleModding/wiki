<?php

namespace App\Mail;

use App\Models\Mod;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class CollaboratorInvitation extends Mailable
{
    use Queueable, SerializesModels;

    /**
     * Create a new message instance.
     */
    public function __construct(
        public User $collaborator,
        public User $invitedBy,
        public Mod $mod,
        public string $role,
        public string $inviteUrl
    ) {
        //
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "You've been invited to collaborate on {$this->mod->name}",
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            markdown: 'emails.collaborator-invitation',
            with: [
                'collaboratorName' => $this->collaborator->name,
                'inviterName' => $this->invitedBy->name,
                'modName' => $this->mod->name,
                'role' => $this->role,
                'inviteUrl' => $this->inviteUrl,
            ]
        );
    }

    /**
     * Get the attachments for the message.
     *
     * @return array<int, \Illuminate\Mail\Mailables\Attachment>
     */
    public function attachments(): array
    {
        return [];
    }
}
