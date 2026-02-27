<?php

namespace App\Http\Controllers;

use App\Mail\CollaboratorInvitation;
use App\Models\Mod;
use App\Models\ModInvitation;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
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
        ]);

        $slug = Str::slug($validated['name']);
        $originalSlug = $slug;
        $counter = 1;

        while (Mod::where('slug', $slug)->exists()) {
            $slug = $originalSlug.'-'.$counter;
            $counter++;
        }

        $mod = Mod::create([
            'name' => $validated['name'],
            'slug' => $slug,
            'description' => $validated['description'],
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

        $mod->load([
            'owner',
            'collaborators',
            'rootPages' => function ($query) {
                $query->published()->with('publishedChildren');
            },
            'indexPage',
        ]);

        $userRole = $user ? $mod->getUserRole($user) : null;

        return Inertia::render('Mods/Show', [
            'mod' => $mod,
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
        ]);

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
     * Show collaborator management page.
     */
    public function manageCollaborators(Mod $mod)
    {
        $user = Auth::user();

        if (! $mod->userCan($user, 'manage_collaborators')) {
            abort(403);
        }

        $mod->load(['owner', 'collaborators']);

        return Inertia::render('Mods/ManageCollaborators', [
            'mod' => $mod,
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

        // Add collaborator directly to mod_users table
        $mod->collaborators()->attach($collaborator->id, [
            'role' => $validated['role'],
            'invited_by' => $user->id,
        ]);

        // Also create and send invitation email
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
            return back()->with('success', 'Collaborator added successfully! (Email notification failed to send)');
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
     * Public documentation view.
     */
    public function publicShow($slug)
    {
        $mod = Mod::where('slug', $slug)
            ->whereIn('visibility', ['public', 'unlisted'])
            ->with(['owner'])
            ->firstOrFail();

        $rootPages = $mod->pages()
            ->whereNull('parent_id')
            ->where('published', true)
            ->with(['children' => function ($query) {
                $query->where('published', true)->orderBy('order_index');
            }])
            ->orderBy('order_index')
            ->get();

        $indexPage = $mod->pages()
            ->where('is_index', true)
            ->where('published', true)
            ->first();

        return Inertia::render('Public/Mod', [
            'mod' => array_merge($mod->toArray(), [
                'root_pages' => $rootPages->map(function ($page) {
                    return [
                        'id' => $page->id,
                        'title' => $page->title,
                        'slug' => $page->slug,
                        'content' => substr($page->content ?? '', 0, 200),
                        'published' => $page->published,
                        'updated_at' => $page->updated_at,
                        'children' => $page->children->map(function ($child) {
                            return [
                                'id' => $child->id,
                                'title' => $child->title,
                                'slug' => $child->slug,
                                'published' => $child->published,
                            ];
                        })->toArray(),
                    ];
                }),
                'index_page' => $indexPage ? [
                    'id' => $indexPage->id,
                    'title' => $indexPage->title,
                    'slug' => $indexPage->slug,
                    'content' => $indexPage->content,
                    'updated_at' => $indexPage->updated_at,
                ] : null,
            ]),
        ]);
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

        return Inertia::render('Invitations/Accept', [
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
}
