<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Article;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Auth;

class ArticleService
{
    public function getAllArticles()
    {
        return Article::with('author:id,name')->orderBy('created_at', 'desc')->get();
    }

    public function getArticleBySlug(string $slug): Article
    {
        return Article::with('author:id,name')->where('slug', $slug)->firstOrFail();
    }

    public function createArticle(array $data): Article
    {
        $data['user_id'] = Auth::id(); // Admin yang sedang login
        $data['slug'] = Str::slug($data['title']) . '-' . Str::random(5); // Slug unik
        
        return Article::create($data);
    }
}