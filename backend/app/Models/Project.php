<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Project extends Model
{
    protected $fillable = [
        'user_id',
        'title',
        'slug',
        'voxel_data',
        'color_palette',
        'time_of_day',
        'is_public'
    ];

    protected $casts = [
        'voxel_data' => 'array',
        'is_public' => 'boolean',
        'time_of_day' => 'double'
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
