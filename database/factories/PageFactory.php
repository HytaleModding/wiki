<?php

namespace Database\Factories;

use App\Models\Mod;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Page>
 */
class PageFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $title = fake()->sentence(3, false);

        $content = $this->generateMarkdownContent();

        return [
            'mod_id' => Mod::factory(),
            'parent_id' => null,
            'title' => $title,
            'slug' => Str::slug($title),
            'content' => $content,
            'order_index' => fake()->numberBetween(0, 100),
            'is_index' => false,
            'published' => fake()->boolean(90),
            'created_by' => User::factory(),
            'updated_by' => User::factory(),
        ];
    }

    /**
     * Generate realistic markdown content.
     */
    private function generateMarkdownContent(): string
    {
        $sections = [];

        $sections[] = "## Introduction\n\n".fake()->paragraph();

        for ($i = 0; $i < fake()->numberBetween(2, 5); $i++) {
            $sectionTitle = fake()->sentence(3, false);
            $sectionContent = fake()->paragraphs(fake()->numberBetween(1, 3), true);

            $sections[] = "## {$sectionTitle}\n\n{$sectionContent}";

            if (fake()->boolean(30)) {
                $code = $this->generateCodeBlock();
                $sections[] = $code;
            }

            if (fake()->boolean(40)) {
                $list = $this->generateList();
                $sections[] = $list;
            }
        }

        return implode("\n\n", $sections);
    }

    /**
     * Generate a code block.
     */
    private function generateCodeBlock(): string
    {
        $languages = ['javascript', 'php', 'python', 'bash', 'json'];
        $lang = fake()->randomElement($languages);

        $codeExamples = [
            'javascript' => "function example() {\n  console.log('Hello, world!');\n  return true;\n}",
            'php' => "<?php\n\nclass Example {\n  public function hello() {\n    return 'Hello, world!';\n  }\n}",
            'python' => "def example():\n    print('Hello, world!')\n    return True",
            'bash' => "#!/bin/bash\necho 'Hello, world!'\nexit 0",
            'json' => '{\n  "name": "example",\n  "version": "1.0.0",\n  "description": "An example"\n}',
        ];

        return "```{$lang}\n{$codeExamples[$lang]}\n```";
    }

    /**
     * Generate a list.
     */
    private function generateList(): string
    {
        $items = [];
        for ($i = 0; $i < fake()->numberBetween(3, 7); $i++) {
            $items[] = '- '.fake()->sentence();
        }

        return implode("\n", $items);
    }

    /**
     * Indicate that the page should be an index page.
     */
    public function index(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_index' => true,
            'slug' => 'index',
            'title' => 'Home',
        ]);
    }

    /**
     * Indicate that the page should be published.
     */
    public function published(): static
    {
        return $this->state(fn (array $attributes) => [
            'published' => true,
        ]);
    }

    /**
     * Indicate that the page should be unpublished.
     */
    public function draft(): static
    {
        return $this->state(fn (array $attributes) => [
            'published' => false,
        ]);
    }
}
