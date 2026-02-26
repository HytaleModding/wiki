@component('mail::message')
# You've been invited to collaborate

Hi {{ $collaboratorName }},

{{ $inviterName }} has invited you to collaborate on **{{ $modName }}** as a **{{ ucfirst($role) }}**.

@component('mail::panel')
**Role Permissions:**
@if($role === 'admin')
- Manage collaborators and invite new members
- Create, edit, and delete pages
- Full access to the mod
@elseif($role === 'editor')
- Create, edit, and publish pages
- Cannot manage collaborators or mod settings
@else
- View private mod content
- Cannot edit or create pages
@endif
@endcomponent

@component('mail::button', ['url' => $inviteUrl])
Accept Invitation
@endcomponent

If you don't want to collaborate on this mod, you can safely ignore this email.

Thanks,<br>
{{ config('app.name') }}

---
<small>This invitation was sent to {{ $collaboratorName }}. If you're not expecting this email, please contact us.</small>
@endcomponent
