<?php

return [
    /* The hostname customers point their CNAME records at. */
    'target' => env('CUSTOM_DOMAIN_TARGET', 'wiki.hytalemodding.dev'),

    /* Caddy calls this application before it obtains an on-demand certificate. */
    'caddy_ask_token' => env('CUSTOM_DOMAIN_CADDY_ASK_TOKEN'),

    /* Set false when developing locally, where public DNS/TLS cannot work. */
    'enabled' => (bool) env('CUSTOM_DOMAINS_ENABLED', true),
];
