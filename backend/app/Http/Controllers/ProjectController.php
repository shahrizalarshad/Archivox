<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use App\Models\Project;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Auth;

class ProjectController extends Controller
{
    /**
     * Menyenaraikan semua projek awam atau projek milik pengguna aktif
     */
    public function index(Request $request)
    {
        $query = Project::query();

        // Jika mahu senarai projek sendiri sahaja (perlu log masuk)
        if ($request->has('user_only') && Auth::guard('sanctum')->check()) {
            $query->where('user_id', Auth::guard('sanctum')->id());
        } else {
            $query->where('is_public', true);
        }

        $projects = $query->orderBy('created_at', 'desc')->get();

        return response()->json($projects);
    }

    /**
     * Menyimpan projek voksel baharu
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:100',
            'voxel_data' => 'required|array',
            'color_palette' => 'nullable|string|max:30',
            'time_of_day' => 'nullable|numeric',
            'is_public' => 'nullable|boolean',
        ]);

        // Jana slug unik berdasarkan tajuk
        $slug = Str::slug($validated['title']);
        $originalSlug = $slug;
        $counter = 1;
        while (Project::where('slug', $slug)->exists()) {
            $slug = $originalSlug . '-' . $counter++;
        }

        // Tentukan user_id (fall back kepada ID 1 jika tetamu)
        $userId = 1;
        if (Auth::guard('sanctum')->check()) {
            $userId = Auth::guard('sanctum')->id();
        }

        $project = Project::create([
            'user_id' => $userId,
            'title' => $validated['title'],
            'slug' => $slug,
            'voxel_data' => $validated['voxel_data'],
            'color_palette' => $validated['color_palette'] ?? 'brutalist_raw',
            'time_of_day' => $validated['time_of_day'] ?? 17.00,
            'is_public' => $validated['is_public'] ?? true,
        ]);

        return response()->json($project, 201);
    }

    /**
     * Memaparkan satu projek spesifik mengikut slug
     */
    public function show($slug)
    {
        $project = Project::where('slug', $slug)->firstOrFail();

        return response()->json($project);
    }

    /**
     * Segerak (Sync) blok melalui WebSockets untuk pemain lain
     */
    public function sync(Request $request, $slug)
    {
        $validated = $request->validate([
            'action' => 'required|in:add,remove,batch',
            'voxels' => 'required|array',
        ]);

        $project = Project::where('slug', $slug)->firstOrFail();

        // Siarkan (Broadcast) perubahan ini kepada pengguna lain, elakkan daripada pengirim asal
        broadcast(new \App\Events\VoxelUpdated($slug, $validated['voxels'], $validated['action']))->toOthers();

        // Opsyenal: Jika kita mahu terus simpan perubahan ini ke pangkalan data setiap kali
        // Kita boleh tambah logik simpan di sini (tetapi untuk kelajuan, mungkin Auto-Save berjadual lebih baik)

        return response()->json(['success' => true]);
    }
}
