<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;

class AiFeatureTest extends TestCase
{
    public function test_ai_generate_rejects_empty_prompt()
    {
        // Use Case 6: AI Generation requires a valid prompt string
        $response = $this->postJson('/api/ai/generate', [
            'prompt' => '' // empty
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['prompt']);
    }

    public function test_ai_generate_handles_missing_api_key_gracefully()
    {
        // Temporarily clear API key for testing
        config(['services.gemini.api_key' => null]);

        $response = $this->postJson('/api/ai/generate', [
            'prompt' => 'A small hut'
        ]);

        // Depending on AiController implementation, it might throw a 500 or a structured JSON with 'success' => false
        // Based on previous AI setup, it returns json with success = false
        $response->assertStatus(400);
        $response->assertJson([
            'success' => false,
            'message' => 'Sila konfigurasi GEMINI_API_KEY di dalam backend .env'
        ]);
    }
}
