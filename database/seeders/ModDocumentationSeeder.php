<?php

namespace Database\Seeders;

use App\Models\Mod;
use App\Models\Page;
use App\Models\User;
use Illuminate\Database\Seeder;

class ModDocumentationSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $adminUser = User::factory()->create([
            'name' => 'Admin User',
            'username' => 'admin',
            'email' => 'admin@example.com',
        ]);

        $regularUser = User::factory()->create([
            'name' => 'Regular User',
            'username' => 'user',
            'email' => 'user@example.com',
        ]);

        $collaboratorUser = User::factory()->create([
            'name' => 'Collaborator',
            'username' => 'collaborator',
            'email' => 'collaborator@example.com',
        ]);

        $otherUsers = User::factory(7)->create();

        $publicMod1 = Mod::factory()->public()->create([
            'name' => 'MyAwesome Mod',
            'slug' => 'myawesome-mod',
            'description' => 'A comprehensive mod that adds amazing features to your game.',
            'owner_id' => $adminUser->id,
        ]);

        $publicMod2 = Mod::factory()->public()->create([
            'name' => 'Tech Documentation',
            'slug' => 'tech-docs',
            'description' => 'Complete technical documentation for developers.',
            'owner_id' => $regularUser->id,
        ]);

        $privateMod = Mod::factory()->private()->create([
            'name' => 'Secret Project',
            'slug' => 'secret-project',
            'description' => 'Internal documentation for our secret project.',
            'owner_id' => $adminUser->id,
        ]);

        $publicMod1->collaborators()->attach($regularUser->id, [
            'role' => 'editor',
            'invited_by' => $adminUser->id,
        ]);

        $publicMod1->collaborators()->attach($collaboratorUser->id, [
            'role' => 'viewer',
            'invited_by' => $adminUser->id,
        ]);

        $privateMod->collaborators()->attach($collaboratorUser->id, [
            'role' => 'admin',
            'invited_by' => $adminUser->id,
        ]);

        $indexPage = Page::factory()->index()->create([
            'mod_id' => $publicMod1->id,
            'title' => 'Welcome to MyAwesome Mod',
            'content' => "# Welcome to MyAwesome Mod\n\nThis mod adds incredible features to enhance your gaming experience.\n\n## Quick Start\n\n1. Download the mod\n2. Install following the guide\n3. Configure your settings\n4. Enjoy!\n\n## Features\n\n- **Enhanced Graphics**: Improved visual effects\n- **New Items**: Over 100 new items to discover\n- **Custom Mechanics**: Unique gameplay mechanics\n- **Performance**: Optimized for better performance",
            'created_by' => $adminUser->id,
            'updated_by' => $adminUser->id,
        ]);

        $installGuide = Page::factory()->create([
            'mod_id' => $publicMod1->id,
            'title' => 'Installation Guide',
            'slug' => 'installation',
            'content' => "# Installation Guide\n\n## Requirements\n\n- Game version 1.0 or higher\n- 2GB free disk space\n- Optional: Mod loader\n\n## Steps\n\n### 1. Download\n\nDownload the latest version from our releases page.\n\n### 2. Extract\n\nExtract the files to your mods folder:\n\n```bash\ncd /path/to/game/mods\nunzip myawesome-mod-v1.0.zip\n```\n\n### 3. Configure\n\nEdit the configuration file:\n\n```json\n{\n  \"enabled\": true,\n  \"graphics\": \"high\",\n  \"difficulty\": \"normal\"\n}\n```\n\n### 4. Launch\n\nStart the game and enjoy!",
            'created_by' => $adminUser->id,
            'updated_by' => $adminUser->id,
        ]);

        $apiDocs = Page::factory()->create([
            'mod_id' => $publicMod1->id,
            'title' => 'API Documentation',
            'slug' => 'api',
            'content' => "# API Documentation\n\n## Overview\n\nMyAwesome Mod provides a comprehensive API for developers.\n\n## Events\n\n### onModLoad\n\nTriggered when the mod is loaded.\n\n```javascript\nmod.on('load', function() {\n  console.log('Mod loaded successfully!');\n});\n```\n\n### onPlayerJoin\n\nTriggered when a player joins.\n\n```javascript\nmod.on('playerJoin', function(player) {\n  player.sendMessage('Welcome!');\n});\n```\n\n## Functions\n\n### addItem(item)\n\nAdds a new item to the game.\n\n**Parameters:**\n- `item` (Object): The item configuration\n\n**Returns:**\n- `boolean`: Success status\n\n**Example:**\n\n```javascript\nmod.addItem({\n  id: 'super_sword',\n  name: 'Super Sword',\n  damage: 100,\n  rarity: 'legendary'\n});\n```",
            'created_by' => $regularUser->id,
            'updated_by' => $regularUser->id,
        ]);

        $troubleshooting = Page::factory()->create([
            'mod_id' => $publicMod1->id,
            'parent_id' => $installGuide->id,
            'title' => 'Troubleshooting',
            'slug' => 'troubleshooting',
            'content' => "# Troubleshooting\n\n## Common Issues\n\n### Mod not loading\n\n**Problem:** The mod doesn't appear in game.\n\n**Solution:**\n1. Check file permissions\n2. Verify mod folder location\n3. Check game version compatibility\n\n### Performance issues\n\n**Problem:** Game runs slowly with mod.\n\n**Solution:**\n1. Lower graphics settings\n2. Disable other mods temporarily\n3. Update your graphics drivers\n\n### Crashes\n\n**Problem:** Game crashes when mod is enabled.\n\n**Solution:**\n1. Check error logs\n2. Update the mod to latest version\n3. Report the issue on our support forum",
            'created_by' => $adminUser->id,
            'updated_by' => $adminUser->id,
        ]);

        Page::factory()->index()->create([
            'mod_id' => $publicMod2->id,
            'title' => 'Technical Documentation Hub',
            'content' => "# Technical Documentation Hub\n\nWelcome to our comprehensive technical documentation.\n\n## What's Inside\n\n- Architecture guides\n- API references  \n- Code examples\n- Best practices\n\n## Getting Started\n\nBrowse the navigation menu to find what you need.",
            'created_by' => $regularUser->id,
            'updated_by' => $regularUser->id,
        ]);

        Page::factory()->create([
            'mod_id' => $publicMod2->id,
            'title' => 'Architecture Overview',
            'slug' => 'architecture',
            'content' => "# Architecture Overview\n\n## System Design\n\nOur system follows a microservices architecture pattern.\n\n## Components\n\n- **API Gateway**: Routes requests\n- **Auth Service**: Handles authentication\n- **Data Layer**: Manages persistence\n- **Cache Layer**: Improves performance",
            'created_by' => $regularUser->id,
            'updated_by' => $regularUser->id,
        ]);

        Page::factory()->index()->create([
            'mod_id' => $privateMod->id,
            'title' => 'Secret Project Documentation',
            'content' => "# Secret Project Documentation\n\n⚠️ **CONFIDENTIAL** ⚠️\n\nThis documentation contains sensitive information.\n\n## Project Overview\n\nDetails about our upcoming features...",
            'created_by' => $adminUser->id,
            'updated_by' => $adminUser->id,
        ]);

        foreach ($otherUsers->take(3) as $user) {
            $mod = Mod::factory()->create([
                'owner_id' => $user->id,
            ]);

            Page::factory()->index()->create([
                'mod_id' => $mod->id,
                'created_by' => $user->id,
                'updated_by' => $user->id,
            ]);

            Page::factory(rand(2, 5))->create([
                'mod_id' => $mod->id,
                'created_by' => $user->id,
                'updated_by' => $user->id,
            ]);
        }

        $this->command->info('Mod documentation platform seeded successfully!');
        $this->command->info('Demo users:');
        $this->command->info('- admin@example.com (password: password)');
        $this->command->info('- user@example.com (password: password)');
        $this->command->info('- collaborator@example.com (password: password)');
    }
}
