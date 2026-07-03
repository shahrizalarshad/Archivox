<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;
use App\Models\Project;
use App\Models\User;
use Illuminate\Support\Facades\Event;
use App\Events\VoxelUpdated;

class SyncFeatureTest extends TestCase
{
    use RefreshDatabase;

    public function test_sync_valid_blocks_broadcasts_event()
    {
        // Fake events so we can assert they were dispatched
        Event::fake();

        $user = User::factory()->create();

        $project = Project::create([
            'title' => 'Test Project',
            'slug' => 'test-project',
            'user_id' => $user->id,
            'voxel_data' => []
        ]);

        $payload = [
            'action' => 'add',
            'voxels' => [
                ['x' => 0, 'y' => 0, 'z' => 0, 'type' => 'ROCK_MESH']
            ]
        ];

        // Use Case 5: Valid payload returns 200 OK
        $response = $this->postJson("/api/projects/{$project->slug}/sync", $payload);
        $response->assertStatus(200);

        // Assert Event was dispatched to WebSocket
        Event::assertDispatched(VoxelUpdated::class, function ($event) use ($project) {
            return $event->projectSlug === $project->slug
                && $event->action === 'add'
                && count($event->voxels) === 1;
        });
    }

    public function test_sync_invalid_payload_fails()
    {
        $user = User::factory()->create();

        $project = Project::create([
            'title' => 'Test Project',
            'slug' => 'test-project',
            'user_id' => $user->id,
            'voxel_data' => []
        ]);

        $payload = [
            'action' => 'invalid_action', // should fail validation (only add, remove, batch allowed)
            'voxels' => 'not an array'
        ];

        // Use Case 4: Invalid payload fails with 422 Unprocessable Entity
        $response = $this->postJson("/api/projects/{$project->slug}/sync", $payload);
        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['action', 'voxels']);
    }
}
