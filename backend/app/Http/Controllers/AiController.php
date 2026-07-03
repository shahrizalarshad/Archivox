<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class AiController extends Controller
{
    public function generate(Request $request)
    {
        $request->validate([
            'prompt' => 'required|string|max:500'
        ]);

        $prompt = $request->input('prompt');
        $apiKey = env('GEMINI_API_KEY');

        if (empty($apiKey) || $apiKey === 'your_api_key_here') {
            return response()->json([
                'success' => false,
                'message' => 'Sila konfigurasi GEMINI_API_KEY di dalam backend .env'
            ], 400);
        }

        $systemPrompt = "You are a 3D Voxel Building AI for Archivox. 
Generate a building/structure based on the user prompt.
Grid constraint: x must be between -10 to 10. z between -10 to 10. y from 0 to 14.
Return EXACTLY a valid JSON array of voxel objects. Each object MUST have: { \"x\": integer, \"y\": integer, \"z\": integer, \"type\": string }.
Available types: GENERIC_BLOCK, WOOD_MESH, ROCK_MESH, SAND_MESH, DIRT_MESH, GRASS_MESH, WATER_MESH, LEAF_MESH, STAIRS_MESH, PILLAR_MESH, GLASS_MESH, FENCE_MESH, LANTERN_MESH.
Ensure structural integrity (don't leave floating blocks unless it's a roof/leaves).
DO NOT return markdown formatting (no ```json). ONLY return the raw JSON array.
User prompt: " . $prompt;

        try {
            $response = Http::withHeaders([
                'Content-Type' => 'application/json',
            ])->post('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' . $apiKey, [
                'contents' => [
                    [
                        'parts' => [
                            ['text' => $systemPrompt]
                        ]
                    ]
                ],
                'generationConfig' => [
                    'temperature' => 0.4,
                    'topK' => 40,
                    'topP' => 0.95,
                    'maxOutputTokens' => 8192,
                    'responseMimeType' => 'application/json'
                ]
            ]);

            if ($response->failed()) {
                Log::error('Gemini API Error: ' . $response->body());
                return response()->json(['success' => false, 'message' => 'Gagal memanggil API Gemini.'], 500);
            }

            $data = $response->json();
            
            if (isset($data['candidates'][0]['content']['parts'][0]['text'])) {
                $rawJson = $data['candidates'][0]['content']['parts'][0]['text'];
                $voxels = json_decode($rawJson, true);
                
                if (json_last_error() === JSON_ERROR_NONE && is_array($voxels)) {
                    return response()->json([
                        'success' => true,
                        'voxels' => $voxels
                    ]);
                }
            }

            return response()->json(['success' => false, 'message' => 'Format JSON tidak sah daripada AI.'], 500);

        } catch (\Exception $e) {
            Log::error('AI Generation Exception: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Ralat dalaman server.'], 500);
        }
    }
}
