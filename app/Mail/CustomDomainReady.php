<?php

namespace App\Mail;

use App\Models\Mod;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class CustomDomainReady extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public Mod $mod) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: "Your custom domain is ready — {$this->mod->custom_domain}");
    }

    public function content(): Content
    {
        return new Content(markdown: 'emails.custom-domain-ready');
    }

    public function attachments(): array
    {
        return [];
    }
}
