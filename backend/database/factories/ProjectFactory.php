<?php

namespace Database\Factories;

use App\Models\Project;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class ProjectFactory extends Factory
{
    protected $model = Project::class;

    public function definition()
    {
        return [
            'user_id' => User::factory(),
            'title' => $this->faker->sentence(3),
            'slug' => $this->faker->slug(),
            'voxel_data' => [],
            'color_palette' => 'brutalist_raw',
            'time_of_day' => 12.0,
            'is_public' => true,
        ];
    }
}
