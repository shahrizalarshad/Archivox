<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('projects', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('title', 100);
            $table->string('slug')->unique();
            $table->json('voxel_data'); // Menyimpan array koordinat spatial [{x, y, z, type}]
            $table->string('color_palette', 30)->default('brutalist_raw');
            $table->decimal('time_of_day', 4, 2)->default(17.00); // Kedudukan matahari (0.00 - 23.59)
            $table->boolean('is_public')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('projects');
    }
};
