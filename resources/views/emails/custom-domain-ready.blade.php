@component('mail::message')
# Your custom domain is ready

Hi {{ $mod->owner->name }},

**{{ $mod->custom_domain }}** is now connected to {{ $mod->name }} and protected by HTTPS.

@component('mail::button', ['url' => 'https://'.$mod->custom_domain])
Open your wiki
@endcomponent

Thanks,<br>
{{ config('app.name') }}
@endcomponent
