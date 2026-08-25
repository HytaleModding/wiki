<?php

use App\Http\Controllers\FileController;
use App\Http\Controllers\GitHubWebhookController;
use App\Http\Controllers\GitHubConnectionController;
use App\Http\Controllers\ModController;
use App\Http\Controllers\PageController;
use App\Http\Middleware\ResolveModByDomain;
use App\Services\PageViewService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken;
use Inertia\Inertia;
use Laravel\Fortify\Features;

Route::get('/', function (Request $request) {
    if ($request->attributes->get('resolved_mod')) {
        return app(ModController::class)->publicShowResolved($request);
    }

    if (! ResolveModByDomain::isFirstPartyHost($request->getHost()) && ! ResolveModByDomain::isLocalHost($request->getHost())) {
        abort(404, 'Documentation not found');
    }

    return Inertia::render('welcome', [
        'canRegister' => Features::enabled(Features::registration()),
    ]);
})->name('home');

Route::post('/webhooks/github', GitHubWebhookController::class)
    ->withoutMiddleware(VerifyCsrfToken::class)
    ->name('webhooks.github');

// Called only by the local Caddy process before it requests an on-demand TLS certificate.
Route::get('/internal/caddy/allow-domain', [ModController::class, 'allowCertificate'])
    ->name('internal.caddy.allow-domain');

Route::get('/github/callback', [GitHubConnectionController::class, 'callback'])
    ->middleware(['auth', 'verified'])
    ->name('github.callback');

Route::get('/privacy', function () {
    return Inertia::render('Legal/Privacy');
})->name('legal.privacy');

Route::get('/terms', function () {
    return Inertia::render('Legal/Terms');
})->name('legal.terms');

Route::group(['prefix' => '/dashboard', 'middleware' => ['auth', 'verified']], function () {

    Route::get('/', function () {
        $user = Auth::user();

        $ownedModsCount = $user->ownedMods()->count();
        $collaborativeModsCount = $user->mods()->count();
        $totalPagesCount = $user->ownedMods()->withCount('pages')->get()->sum('pages_count') +
            $user->mods()->withCount('pages')->get()->sum('pages_count');

        $pageViewService = app(PageViewService::class);
        $publicViewsCount = $pageViewService->getTotalPublicViews($user->id);

        $ownedMods = $user->ownedMods()
            ->with(['pages' => function ($query) {
                $query->orderBy('updated_at', 'desc')->limit(5);
            }])
            ->withCount(['pages', 'collaborators'])
            ->orderBy('updated_at', 'desc')
            ->limit(5)
            ->get();

        $collaborativeMods = $user->mods()
            ->with(['pages' => function ($query) {
                $query->orderBy('updated_at', 'desc')->limit(5);
            }])
            ->withCount(['pages', 'collaborators'])
            ->orderBy('updated_at', 'desc')
            ->limit(5)
            ->get();

        $latestMods = $ownedMods->merge($collaborativeMods)
            ->sortByDesc('updated_at')
            ->take(5)
            ->map(function ($mod) {
                return [
                    'slug' => $mod->slug,
                    'name' => $mod->name,
                    'description' => $mod->description,
                    'icon_url' => $mod->icon_url,
                    'updated_at' => $mod->updated_at,
                    'pages_count' => $mod->pages_count,
                    'collaborators_count' => $mod->collaborators_count,
                    'latest_pages' => $mod->pages->map(function ($page) {
                        return [
                            'title' => $page->title,
                            'slug' => $page->slug,
                            'updated_at' => $page->updated_at,
                        ];
                    })->toArray(),
                ];
            })
            ->values();

        return Inertia::render('dashboard', [
            'stats' => [
                'ownedModsCount' => $ownedModsCount,
                'collaborativeModsCount' => $collaborativeModsCount,
                'totalPagesCount' => $totalPagesCount,
                'publicViewsCount' => $publicViewsCount,
                'latestMods' => $latestMods,
            ],
        ]);
    })->name('dashboard');

    Route::resource('/mods', ModController::class)->except(['show', 'edit']);
    Route::get('/mods/{mod:slug}', [ModController::class, 'show'])->name('mods.show');
    Route::get('/mods/{mod:slug}/edit', [ModController::class, 'edit'])->name('mods.edit');
    Route::get('/mods/{mod:slug}/settings/{section}', [ModController::class, 'settings'])
        ->whereIn('section', ['general', 'domain', 'github', 'appearance', 'danger'])
        ->name('mods.settings');
    Route::get('/mods/{mod:slug}/css-editor', [ModController::class, 'cssEditor'])->name('mods.css-editor');
    Route::patch('/mods/{mod:slug}/css', [ModController::class, 'updateCss'])->name('mods.css.update');
    Route::get('/mods/{mod:slug}/github/connect', [GitHubConnectionController::class, 'redirect'])->name('mods.github.connect');
    Route::delete('/mods/{mod:slug}/github/connect', [GitHubConnectionController::class, 'disconnect'])->name('mods.github.disconnect');
    Route::get('/mods/{mod:slug}/github/repositories', [GitHubConnectionController::class, 'repositories'])->name('mods.github.repositories');
    Route::post('/mods/{mod:slug}/github/repository', [GitHubConnectionController::class, 'selectRepository'])->name('mods.github.repository.select');
    Route::post('/mods/{mod:slug}/domain/verify', [ModController::class, 'verifyDomain'])->name('mods.domain.verify');
    Route::patch('/mods/{mod:slug}/domain', [ModController::class, 'updateDomain'])->name('mods.domain.update');

    Route::get('/mods/{mod:slug}/collaborators', [ModController::class, 'manageCollaborators'])->name('mods.collaborators.index');
    Route::post('/mods/{mod:slug}/collaborators', [ModController::class, 'addCollaborator'])->name('mods.collaborators.store');
    Route::delete('/mods/{mod:slug}/collaborators/{collaborator}', [ModController::class, 'removeCollaborator'])->name('mods.collaborators.destroy');
    Route::patch('/mods/{mod:slug}/collaborators/{collaborator}', [ModController::class, 'updateCollaboratorRole'])->name('mods.collaborators.update');

    Route::get('/mods/{mod:slug}/pages', [PageController::class, 'index'])->name('pages.index');
    Route::get('/mods/{mod:slug}/pages/create', [PageController::class, 'create'])->name('pages.create');
    Route::post('/mods/{mod:slug}/pages', [PageController::class, 'store'])->name('pages.store');
    Route::get('/mods/{mod:slug}/pages/{page:slug}', [PageController::class, 'show'])->name('pages.show');
    Route::get('/mods/{mod:slug}/pages/{page:slug}/edit', [PageController::class, 'edit'])->name('pages.edit');
    Route::patch('/mods/{mod:slug}/pages/{page:slug}', [PageController::class, 'update'])->name('pages.update');
    Route::delete('/mods/{mod:slug}/pages/{page:slug}', [PageController::class, 'destroy'])->name('pages.destroy');

    Route::post('/mods/{mod:slug}/pages/reorder', [PageController::class, 'updateOrder'])->name('pages.reorder');
    Route::post('/mods/{mod:slug}/pages/{page:slug}/autosave', [PageController::class, 'autoSave'])->name('pages.autosave');
    Route::get('/mods/{mod:slug}/pages/search', [PageController::class, 'search'])->name('pages.search');

    Route::get('/mods/{mod:slug}/files', [FileController::class, 'index'])->name('files.index');
    Route::post('/mods/{mod:slug}/files', [FileController::class, 'store'])->name('files.store');
    Route::get('/mods/{mod:slug}/files/{file}', [FileController::class, 'show'])->name('files.show');
    Route::delete('/mods/{mod:slug}/files/{file}', [FileController::class, 'destroy'])->name('files.destroy');
    Route::get('/mods/{mod:slug}/files/{file}/download', [FileController::class, 'download'])->name('files.download');

    Route::post('/mods/{mod:slug}/files/quick-upload', [FileController::class, 'quickUpload'])->name('files.quick-upload');
    Route::get('/mods/{mod:slug}/pages/{page:slug}/files', [FileController::class, 'getPageFiles'])->name('files.page');
});

Route::get('/mods', [ModController::class, 'publicIndex'])->name('public.mods');
Route::get('/mod/{mod:slug}', [ModController::class, 'publicShow'])->name('public.mod');
Route::get('/mod/{mod:slug}/{page:slug}', [PageController::class, 'publicShow'])->name('public.page');

Route::middleware('mod.domain')
    ->get('/{pageSlug}', [PageController::class, 'publicShowResolved'])
    ->where('pageSlug', '[A-Za-z0-9\-_]+')
    ->name('public.page.domain');

Route::get('invitations/{token}', [ModController::class, 'showInvitation'])->name('invitations.show');
Route::post('invitations/{token}/accept', [ModController::class, 'acceptInvitation'])->name('invitations.accept')->middleware('auth');
Route::post('invitations/{token}/reject', [ModController::class, 'rejectInvitation'])->name('invitations.reject')->middleware('auth');
Route::delete('invitations/{token}/cancel', [ModController::class, 'cancelInvitation'])->name('invitations.cancel')->middleware('auth');

require __DIR__.'/settings.php';
