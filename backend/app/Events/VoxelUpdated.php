<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class VoxelUpdated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $projectSlug;
    public $voxels;
    public $action;

    /**
     * Create a new event instance.
     *
     * @param string $projectSlug
     * @param array $voxels  Array of voxel objects {x,y,z,type}
     * @param string $action 'add' or 'remove'
     */
    public function __construct(string $projectSlug, array $voxels, string $action)
    {
        $this->projectSlug = $projectSlug;
        $this->voxels = $voxels;
        $this->action = $action;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return \Illuminate\Broadcasting\Channel
     */
    public function broadcastOn()
    {
        return new Channel('project.' . $this->projectSlug);
    }
}
