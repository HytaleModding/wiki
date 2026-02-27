<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Mod>
 */
class ModFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $name = fake()->unique()->words(2, true).' Mod';

        return [
            'name' => $name,
            'slug' => Str::slug($name),
            'description' => fake()->paragraph(),
            'owner_id' => User::factory(),
            'visibility' => fake()->randomElement(['public', 'private', 'unlisted']),
            'storage_driver' => fake()->randomElement(['local', 's3']),
        ];
    }

    /**
     * Indicate that the mod should be public.
     */
    public function public(): static
    {
        return $this->state(fn (array $attributes) => [
            'visibility' => 'public',
        ]);
    }

    /**
     * Indicate that the mod should be private.
     */
    public function private(): static
    {
        return $this->state(fn (array $attributes) => [
            'visibility' => 'private',
        ]);
    }

    /**
     * Indicate that the mod should use S3 storage.
     */
    public function withS3(): static
    {
        return $this->state(fn (array $attributes) => [
            'storage_driver' => 's3',
        ]);
    }
}
