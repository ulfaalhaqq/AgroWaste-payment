<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreArticleRequest;
use App\Services\ArticleService;
use Illuminate\Http\JsonResponse;

class ArticleController extends Controller
{
    public function __construct(protected ArticleService $articleService) {}

    /**
     * Public: Ambil semua artikel
     */
    public function index(): JsonResponse
    {
        $articles = $this->articleService->getAllArticles();
        return response()->json(['success' => true, 'message' => 'Daftar artikel.', 'data' => $articles], 200);
    }

    /**
     * Public: Ambil detail artikel berdasarkan slug
     */
    public function show(string $slug): JsonResponse
    {
        $article = $this->articleService->getArticleBySlug($slug);
        return response()->json(['success' => true, 'message' => 'Detail artikel.', 'data' => $article], 200);
    }

    /**
     * Admin: Buat artikel baru
     */
    public function store(StoreArticleRequest $request): JsonResponse
    {
        $article = $this->articleService->createArticle($request->validated());
        return response()->json(['success' => true, 'message' => 'Artikel berhasil dibuat.', 'data' => $article], 201);
    }
}