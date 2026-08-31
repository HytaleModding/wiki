<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class EnsureAccountActive
{
    public function handle(Request $request, Closure $next)
    {
        abort_if($request->user()?->is_suspended, 403, 'This account has been suspended.');

        return $next($request);
    }
}
