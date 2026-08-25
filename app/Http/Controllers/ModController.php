<?php

namespace App\Http\Controllers;

use App\Mail\CollaboratorInvitation;
use App\Models\Mod;
use App\Models\ModInvitation;
use App\Models\Page;
use App\Models\User;
use App\Support\CustomCssSanitizer;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class ModController extends Controller
{
    /**
     * Display a listing of user's mods.
     */
    public function index()
    {
        $user = Auth::user();

        if (! $user) {
            return redirect()->route('login');
        }

        $ownedMods = $user->ownedMods()
            ->withCount('pages')
            ->withCount('collaborators')
            ->latest()
            ->get();

        $collaborativeMods = $user->mods()
            ->with(['owner'])
            ->withCount('pages')
            ->latest()
            ->get();

        return Inertia::render('Mods/Index', [
            'ownedMods' => $ownedMods,
            'collaborativeMods' => $collaborativeMods,
        ]);
    }

    /**
     * Show the form for creating a new mod.
     */
    public function create()
    {
        return Inertia::render('Mods/Create');
    }

    /**
     * Store a newly created mod.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'visibility' => 'required|in:public,private,unlisted',
            'storage_driver' => 'required|in:local,s3',
            'icon' => 'nullable|file|image|max:2048|mimes:jpeg,png,gif,webp', // 2MB max for icons
        ]);

        $slug = Str::slug($validated['name']);
        $originalSlug = $slug;
        $counter = 1;

        while (Mod::where('slug', $slug)->exists()) {
            $slug = $originalSlug.'-'.$counter;
            $counter++;
        }

        $iconUrl = null;
        if ($request->hasFile('icon')) {
            $iconFile = $request->file('icon');
            $iconFilename = Str::uuid().'.'.$iconFile->getClientOriginalExtension();
            $iconPath = "mods/icons/{$iconFilename}";

            $iconFile->storeAs('mods/icons', $iconFilename, 'public');
            $iconUrl = Storage::disk('public')->url($iconPath);
        }

        $mod = Mod::create([
            'name' => $validated['name'],
            'slug' => $slug,
            'description' => $validated['description'],
            'icon_url' => $iconUrl,
            'owner_id' => Auth::id(),
            'visibility' => $validated['visibility'],
            'storage_driver' => $validated['storage_driver'],
        ]);

        return redirect()->route('mods.show', $mod->slug)
            ->with('success', 'Mod created successfully!');
    }

    /**
     * Display the specified mod (authenticated view).
     */
    public function show(Mod $mod)
    {
        $user = Auth::user();

        if ($mod->visibility === 'private' && ! $mod->canBeAccessedBy($user)) {
            abort(403);
        }

        $publishedChildren = function ($query) use (&$publishedChildren) {
            $query->where('published', true)
                ->orderBy('order_index')
                ->with(['children' => $publishedChildren]);
        };

        $mod->load([
            'owner',
            'collaborators',
            'rootPages' => function ($query) use ($publishedChildren) {
                $query->published()
                    ->orderBy('order_index')
                    ->with(['children' => $publishedChildren]);
            },
            'indexPage',
        ]);

        $userRole = $user ? $mod->getUserRole($user) : null;

        return Inertia::render('Mods/Show', [
            'mod' => array_merge($mod->toArray(), [
                'owner' => $this->serializeOwner($mod->owner),
                'collaborators' => $mod->collaborators->map(function (User $collaborator) {
                    return array_merge($this->serializeOwner($collaborator), [
                        'pivot' => [
                            'role' => $collaborator->pivot->role,
                        ],
                    ]);
                })->values()->toArray(),
            ]),
            'userRole' => $userRole,
            'canEdit' => $user && $mod->userCan($user, 'edit'),
            'canManage' => $user && $mod->userCan($user, 'manage_collaborators'),
        ]);
    }

    /**
     * Show the form for editing the mod.
     */
    public function edit(Mod $mod)
    {
        $user = Auth::user();

        if (! $mod->userCan($user, 'manage_settings')) {
            abort(403);
        }

        return Inertia::render('Mods/Edit', [
            'mod' => $mod,
            'githubConnected' => $user->githubConnection()->exists(),
        ]);
    }

    /**
     * Update the specified mod.
     */
    public function update(Request $request, Mod $mod)
    {
        $user = Auth::user();

        if (! $mod->userCan($user, 'manage_settings')) {
            abort(403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'visibility' => 'required|in:public,private,unlisted',
            'storage_driver' => 'required|in:local,s3',
            'icon' => 'nullable|file|image|max:2048|mimes:jpeg,png,gif,webp',
            'external_access' => 'nullable|boolean',
            'github_repository_url' => ['nullable', 'string', 'max:255', 'url', 'regex:/^https:\/\/github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+(?:\.git)?\/?$/'],
            'github_repository_path' => 'nullable|string|max:512',
            'custom_css' => $this->customCssRules(),
            'custom_domain' => [
                'nullable',
                'string',
                'max:255',
                'regex:/^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/',
                Rule::unique('mods', 'custom_domain')->ignore($mod->id),
            ],
        ]);

        $validated['github_repository_url'] = blank($validated['github_repository_url'] ?? null)
            ? null
            : trim((string) $validated['github_repository_url']);

        $validated['github_repository_path'] = blank($validated['github_repository_path'] ?? null)
            ? null
            : trim((string) $validated['github_repository_path'], '/');

        $validated['custom_domain'] = blank($validated['custom_domain'] ?? null)
            ? null
            : strtolower(trim((string) $validated['custom_domain']));

        if ($validated['custom_domain'] !== $mod->custom_domain) {
            $validated['domain_verified'] = false;
            $validated['domain_verification_token'] = $validated['custom_domain']
                ? 'wiki-verify='.Str::random(32)
                : null;
        }

        if ($validated['name'] !== $mod->name) {
            $slug = Str::slug($validated['name']);
            $originalSlug = $slug;
            $counter = 1;

            while (Mod::where('slug', $slug)->where('id', '!=', $mod->id)->exists()) {
                $slug = $originalSlug.'-'.$counter;
                $counter++;
            }

            $validated['slug'] = $slug;
        }

        if ($request->hasFile('icon')) {
            if ($mod->icon_url) {
                $oldPath = str_replace('/storage/', '', parse_url($mod->icon_url, PHP_URL_PATH));
                Storage::disk('public')->delete($oldPath);
            }

            $iconFile = $request->file('icon');
            $iconFilename = Str::uuid().'.'.$iconFile->getClientOriginalExtension();
            $iconPath = "mods/icons/{$iconFilename}";

            $iconFile->storeAs('mods/icons', $iconFilename, 'public');
            $validated['icon_url'] = Storage::disk('public')->url($iconPath);
        } else {
            $validated['icon_url'] = null;
        }

        $mod->update($validated);

        return redirect()->route('mods.show', $mod->slug)
            ->with('success', 'Mod updated successfully!');
    }

    /**
     * Remove the specified mod.
     */
    public function destroy(Mod $mod)
    {
        $user = Auth::user();

        if ($mod->owner_id !== $user->id) {
            abort(403, 'Only the owner can delete this mod.');
        }

        $mod->delete();

        return redirect()->route('mods.index')
            ->with('success', 'Mod deleted successfully!');
    }

    /**
     * Show the CSS editor page.
     */
    public function cssEditor(Mod $mod)
    {
        $user = Auth::user();

        if (! $mod->userCan($user, 'manage_settings')) {
            abort(403);
        }

        return Inertia::render('Mods/CssEditor', [
            'mod' => $mod,
        ]);
    }

    /**
     * Update only the custom CSS for a mod.
     */
    public function updateCss(Request $request, Mod $mod)
    {
        $user = Auth::user();

        if (! $mod->userCan($user, 'manage_settings')) {
            abort(403);
        }

        $validated = $request->validate([
            'custom_css' => $this->customCssRules(),
        ]);

        $mod->update(['custom_css' => $validated['custom_css'] ?? null]);

        return back()->with('success', 'CSS saved successfully!');
    }

    /**
     * Show collaborator management page.
     */
    public function manageCollaborators(Mod $mod)
    {
        $user = Auth::user();

        if (! $mod->userCan($user, 'manage_collaborators')) {
            abort(403);
        }

        $mod->load(['owner', 'collaborators']);

        $pendingInvitations = ModInvitation::with(['user', 'inviter'])
            ->where('mod_id', $mod->id)
            ->whereNull('accepted_at')
            ->where('expires_at', '>', now())
            ->get();

        return Inertia::render('Mods/ManageCollaborators', [
            'mod' => $mod,
            'pendingInvitations' => $pendingInvitations,
            'canManage' => true,
        ]);
    }

    /**
     * Add collaborator to mod.
     */
    public function addCollaborator(Request $request, Mod $mod)
    {
        $user = Auth::user();

        if (! $mod->userCan($user, 'manage_collaborators')) {
            abort(403);
        }

        $validated = $request->validate([
            'username' => 'required|string',
            'role' => 'required|in:admin,editor,viewer',
        ]);

        $collaborator = User::where('username', $validated['username'])
            ->orWhere('email', $validated['username'])
            ->first();

        if (! $collaborator) {
            return back()->withErrors(['email' => 'User not found.']);
        }

        if ($mod->collaborators()->where('user_id', $collaborator->id)->exists()) {
            return back()->withErrors(['email' => 'User is already a collaborator.']);
        }

        if ($mod->owner_id === $collaborator->id) {
            return back()->withErrors(['email' => 'Owner cannot be added as collaborator.']);
        }

        $existingInvitation = ModInvitation::where('mod_id', $mod->id)
            ->where('user_id', $collaborator->id)
            ->whereNull('accepted_at')
            ->where('expires_at', '>', now())
            ->first();

        if ($existingInvitation) {
            return back()->withErrors(['email' => 'User already has a pending invitation.']);
        }

        $invitation = ModInvitation::createInvitation($mod, $collaborator, $user, $validated['role']);
        $inviteUrl = route('invitations.show', ['token' => $invitation->token]);

        try {
            Mail::to($collaborator->email)->send(new CollaboratorInvitation(
                collaborator: $collaborator,
                invitedBy: $user,
                mod: $mod,
                role: $validated['role'],
                inviteUrl: $inviteUrl
            ));

            return back()->with('success', "Invitation sent to {$collaborator->name}!");
        } catch (\Exception $e) {
            return back()->withErrors(["Failed to send invitation email: {$e->getMessage()}"]);
        }
    }

    /**
     * Remove collaborator from mod.
     */
    public function removeCollaborator(Mod $mod, User $collaborator)
    {
        $user = Auth::user();

        // Allow users to remove themselves
        if ($user->id === $collaborator->id) {
            $mod->collaborators()->detach($collaborator->id);

            return back()->with('success', 'You have left the mod successfully!');
        }

        if (! $mod->userCan($user, 'manage_collaborators')) {
            abort(403);
        }

        $currentUserRole = $mod->getUserRole($user);
        $targetUserRole = $mod->getUserRole($collaborator);

        // Admins cannot remove other admins (only owners can)
        if ($currentUserRole === 'admin' && $targetUserRole === 'admin') {
            abort(403);
        }

        $mod->collaborators()->detach($collaborator->id);

        return back()->with('success', 'Collaborator removed successfully!');
    }

    /**
     * Update collaborator role.
     */
    public function updateCollaboratorRole(Request $request, Mod $mod, User $collaborator)
    {
        $user = Auth::user();

        if (! $mod->userCan($user, 'manage_collaborators')) {
            abort(403);
        }

        $validated = $request->validate([
            'role' => 'required|in:admin,editor,viewer',
        ]);

        $currentUserRole = $mod->getUserRole($user);
        $targetRole = $validated['role'];

        // Only owners can promote to admin
        if ($targetRole === 'admin' && $currentUserRole !== 'owner') {
            abort(403);
        }

        $mod->collaborators()->updateExistingPivot($collaborator->id, [
            'role' => $validated['role'],
        ]);

        return back()->with('success', 'Collaborator role updated successfully!');
    }

    /**
     * Public listing of all public mods.
     */
    public function publicIndex(Request $request)
    {
        $query = $request->string('q')->toString();

        $mods = Mod::where('visibility', 'public')
            ->when($query, function ($q) use ($query) {
                $q->where(function ($inner) use ($query) {
                    $inner->where('name', 'like', '%'.$query.'%')
                        ->orWhere('description', 'like', '%'.$query.'%');
                });
            })
            ->with(['owner'])
            ->withCount('publishedPages')
            ->orderBy('updated_at', 'desc')
            ->paginate(24)
            ->withQueryString();

        $mods = $this->sanitizePublicModPaginator($mods);

        return Inertia::render('Public/Mods', [
            'mods' => $mods,
            'query' => $query,
        ]);
    }

    /**
     * Public documentation view.
     */
    public function publicShow($slug)
    {
        return $this->publicShowForSlug(request(), (string) $slug);
    }

    /**
     * Public documentation view for custom-domain requests.
     */
    public function publicShowResolved(Request $request)
    {
        $mod = $request->attributes->get('resolved_mod');
        $user = Auth::user();

        if (! $mod instanceof Mod) {
            abort(404, 'Documentation not found');
        }

        if (! $this->canViewPublicDocumentation($mod, $user)) {
            abort(404, 'Documentation not found');
        }

        return Inertia::render('Public/Mod', [
            'mod' => $this->buildPublicModPayload($mod->load(['owner'])),
        ]);
    }

    /**
     * Verify DNS ownership for an assigned custom domain.
     */
    public function verifyDomain(Request $request, Mod $mod)
    {
        $user = Auth::user();

        if (! $mod->userCan($user, 'manage_settings')) {
            abort(403);
        }

        if (blank($mod->custom_domain) || blank($mod->domain_verification_token)) {
            $message = 'Set a custom domain first to generate a verification token.';

            return $request->expectsJson()
                ? response()->json(['message' => $message], 422)
                : back()->withErrors(['custom_domain' => $message]);
        }

        $txtRecords = dns_get_record($mod->custom_domain, DNS_TXT) ?: [];
        $txtVerified = collect($txtRecords)->contains(function (array $record) use ($mod) {
            $value = (string) ($record['txt'] ?? '');

            return str_contains($value, (string) $mod->domain_verification_token);
        });

        $appHost = (string) parse_url((string) config('app.url'), PHP_URL_HOST);
        $cnameRecords = dns_get_record($mod->custom_domain, DNS_CNAME) ?: [];
        $cnameVerified = collect($cnameRecords)->contains(function (array $record) use ($appHost) {
            $target = rtrim(strtolower((string) ($record['target'] ?? '')), '.');

            return $target !== '' && $appHost !== '' && $target === strtolower($appHost);
        });

        if ($txtVerified || $cnameVerified) {
            $mod->update([
                'domain_verified' => true,
            ]);

            return $request->expectsJson()
                ? response()->json(['verified' => true, 'message' => 'Domain verified successfully.'])
                : back()->with('success', 'Domain verified successfully.');
        }

        $mod->update([
            'domain_verified' => false,
        ]);

        $message = 'Domain verification failed. Add the TXT token or CNAME record and try again.';

        return $request->expectsJson()
            ? response()->json(['verified' => false, 'message' => $message], 422)
            : back()->withErrors(['custom_domain' => $message]);
    }

    private function publicShowForSlug(Request $request, string $slug)
    {
        $resolvedMod = $request->attributes->get('resolved_mod');
        $user = Auth::user();

        if ($resolvedMod instanceof Mod) {
            if ($resolvedMod->slug !== $slug) {
                abort(404, 'Documentation not found');
            }

            if (! $this->canViewPublicDocumentation($resolvedMod, $user)) {
                abort(404, 'Documentation not found');
            }

            return Inertia::render('Public/Mod', [
                'mod' => $this->buildPublicModPayload($resolvedMod->load(['owner'])),
            ]);
        }

        $mod = Mod::where('slug', $slug)
            ->with(['owner'])
            ->firstOrFail();

        if (! $this->canViewPublicDocumentation($mod, $user)) {
            abort(404, 'Documentation not found');
        }

        return Inertia::render('Public/Mod', [
            'mod' => $this->buildPublicModPayload($mod),
        ]);
    }

    private function canViewPublicDocumentation(Mod $mod, ?User $user): bool
    {
        if (in_array($mod->visibility, ['public', 'unlisted'], true)) {
            return true;
        }

        return $user ? $mod->canBeAccessedBy($user) : false;
    }

    private function buildPublicModPayload(Mod $mod): array
    {
        $publishedChildren = function ($query) use (&$publishedChildren) {
            $query->where('published', true)
                ->orderBy('order_index')
                ->with(['children' => $publishedChildren]);
        };

        $rootPages = $mod->pages()
            ->whereNull('parent_id')
            ->where('published', true)
            ->with(['children' => $publishedChildren])
            ->orderBy('order_index')
            ->get();

        $indexPage = $mod->pages()
            ->where('is_index', true)
            ->where('published', true)
            ->first();

        return [
            'id' => $mod->id,
            'name' => $mod->name,
            'slug' => $mod->slug,
            'description' => $mod->description,
            'icon_url' => $mod->icon_url,
            'visibility' => $mod->visibility,
            'custom_css' => $mod->safe_custom_css,
            'custom_domain' => $mod->custom_domain,
            'owner' => $this->serializeOwner($mod->owner),
            'root_pages' => $rootPages
                ->map(fn (Page $page) => $this->serializePublicPageTree($page, true))
                ->values()
                ->toArray(),
            'index_page' => $indexPage ? [
                'id' => $indexPage->id,
                'title' => $indexPage->title,
                'slug' => $indexPage->slug,
                'kind' => $indexPage->kind,
                'content' => $indexPage->content,
                'updated_at' => $indexPage->updated_at,
            ] : null,
        ];
    }

    private function customCssRules(): array
    {
        return [
            'nullable',
            'string',
            'max:65535',
            function (string $attribute, mixed $value, \Closure $fail): void {
                foreach (CustomCssSanitizer::violations(is_string($value) ? $value : null) as $violation) {
                    $fail($violation);
                }
            },
        ];
    }

    private function sanitizePublicModPaginator(LengthAwarePaginator $mods): LengthAwarePaginator
    {
        return $mods->through(function (Mod $mod) {
            return [
                'id' => $mod->id,
                'name' => $mod->name,
                'slug' => $mod->slug,
                'description' => $mod->description,
                'icon_url' => $mod->icon_url,
                'visibility' => $mod->visibility,
                'owner' => $this->serializeOwner($mod->owner),
                'published_pages_count' => $mod->published_pages_count,
                'updated_at' => $mod->updated_at,
            ];
        });
    }

    private function serializeOwner(User $owner): array
    {
        return [
            'name' => $owner->name,
            'username' => $owner->username,
            'avatar_url' => $owner->avatar_url,
        ];
    }

    private function serializePublicPageTree(Page $page, bool $includeContent): array
    {
        $payload = [
            'id' => $page->id,
            'title' => $page->title,
            'slug' => $page->slug,
            'kind' => $page->kind,
            'published' => $page->published,
            'updated_at' => $page->updated_at,
            'children' => $page->children
                ->map(fn (Page $child) => $this->serializePublicPageTree($child, false))
                ->values()
                ->toArray(),
        ];

        if ($includeContent) {
            $payload['content'] = substr($page->content ?? '', 0, 200);
        }

        return $payload;
    }

    /**
     * Show invitation acceptance page.
     */
    public function showInvitation(string $token)
    {
        $invitation = ModInvitation::with(['mod', 'user', 'inviter'])
            ->where('token', $token)
            ->firstOrFail();

        if ($invitation->isExpired()) {
            return Inertia::render('Invitations/Expired', [
                'invitation' => $invitation,
            ]);
        }

        if ($invitation->isAccepted()) {
            return redirect()->route('mods.show', $invitation->mod->slug)
                ->with('success', 'You are already a collaborator on this mod!');
        }

        $user = Auth::user();
        if (! $user || $user->id !== $invitation->user_id) {
            return Inertia::render('Invitations/Login', [
                'invitation' => $invitation,
                'needsLogin' => ! $user,
                'wrongUser' => $user && $user->id !== $invitation->user_id,
            ]);
        }

        return Inertia::render('Invitations/Show', [
            'invitation' => $invitation,
        ]);
    }

    /**
     * Accept an invitation.
     */
    public function acceptInvitation(string $token)
    {
        $user = Auth::user();

        $invitation = ModInvitation::with(['mod', 'user'])
            ->where('token', $token)
            ->firstOrFail();

        if (! $user || $user->id !== $invitation->user_id) {
            return redirect()->route('login')
                ->with('error', 'Please login to accept this invitation.');
        }

        if ($invitation->isExpired()) {
            return redirect()->route('invitations.show', $token)
                ->with('error', 'This invitation has expired.');
        }

        if ($invitation->isAccepted()) {
            return redirect()->route('mods.show', $invitation->mod->slug)
                ->with('success', 'You are already a collaborator on this mod!');
        }

        if ($invitation->accept()) {
            return redirect()->route('mods.show', $invitation->mod->slug)
                ->with('success', "Welcome to {$invitation->mod->name}! You are now a {$invitation->role}.");
        }

        return redirect()->route('invitations.show', $token)
            ->with('error', 'Failed to accept invitation. Please try again.');
    }

    /**
     * Cancel an invitation (for mod owners/admins).
     */
    public function cancelInvitation(string $token)
    {
        $user = Auth::user();

        $invitation = ModInvitation::with(['mod', 'user'])
            ->where('token', $token)
            ->firstOrFail();

        if (! $invitation->mod->userCan($user, 'manage_collaborators')) {
            abort(403);
        }

        if ($invitation->isExpired()) {
            return back()->withErrors(['invitation' => 'This invitation has already expired.']);
        }

        if ($invitation->isAccepted()) {
            return back()->withErrors(['invitation' => 'This invitation has already been accepted.']);
        }

        $invitedUserName = $invitation->user->name;
        $invitation->delete();

        return back()->with('success', "Invitation to {$invitedUserName} has been cancelled.");
    }

    /**
     * Rejet an invitation.
     */
    public function rejectInvitation(string $token)
    {
        $user = Auth::user();

        $invitation = ModInvitation::with(['mod', 'user'])
            ->where('token', $token)
            ->firstOrFail();

        if (! $user || $user->id !== $invitation->user_id) {
            return redirect()->route('login')
                ->with('error', 'Please login to reject this invitation.');
        }

        if ($invitation->isExpired()) {
            return redirect()->route('invitations.show', $token)
                ->with('error', 'This invitation has expired.');
        }

        if ($invitation->isAccepted()) {
            return redirect()->route('mods.show', $invitation->mod->slug)
                ->with('success', 'You are already a collaborator on this mod!');
        }

        if ($invitation->reject()) {
            return redirect()->route('mods.index')
                ->with('success', "You have rejected the invitation to {$invitation->mod->name}.");
        }

        return redirect()->route('invitations.show', $token)
            ->with('error', 'Failed to reject invitation. Please try again.');
    }
}
