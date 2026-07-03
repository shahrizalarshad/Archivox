<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;
use App\Models\User;
use App\Models\Project;

class ProjectApiTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test user can get the list of projects.
     *
     * @return void
     */
    public function test_can_fetch_projects_list()
    {
        // Given we have some projects
        Project::factory()->count(3)->create();

        // When we call the projects api
        $response = $this->getJson('/api/projects');

        // Then we should get a successful response with 3 items
        $response->assertStatus(200);
        $response->assertJsonCount(3);
    }

    /**
     * Test authenticated user can create a project.
     *
     * @return void
     */
    public function test_authenticated_user_can_create_project()
    {
        $user = User::factory()->create();

        $payload = [
            'title' => 'My Test Project',
            'voxel_data' => [
                ['x' => 0, 'y' => 0, 'z' => 0, 'type' => 'GRASS_MESH', 'isStair' => false]
            ],
            'color_palette' => 'brutalist_raw',
            'time_of_day' => 12.5,
            'is_public' => false
        ];

        $response = $this->actingAs($user, 'sanctum')->postJson('/api/projects', $payload);

        $response->assertStatus(201);
        $response->assertJsonFragment(['title' => 'My Test Project']);
        $this->assertDatabaseHas('projects', ['title' => 'My Test Project', 'user_id' => $user->id]);
    }
}
