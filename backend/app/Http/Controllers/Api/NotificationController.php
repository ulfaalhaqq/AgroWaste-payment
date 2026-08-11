<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;

class NotificationController extends Controller
{
    public function __construct(protected NotificationService $notificationService) {}

    /**
     * Endpoint untuk Frontend melakukan polling notifikasi
     */
    public function index(): JsonResponse
    {
        $notifications = $this->notificationService->getUnread();

        return response()->json([
            'success' => true,
            'message' => 'Data notifikasi berhasil diambil.',
            'data'    => $notifications
        ], 200);
    }

    /**
     * Endpoint untuk menandai notifikasi sudah dibaca
     */
    public function markAsRead(string $id): JsonResponse
    {
        $notification = $this->notificationService->markAsRead($id);

        return response()->json([
            'success' => true,
            'message' => 'Notifikasi ditandai sudah dibaca.',
            'data'    => $notification
        ], 200);
    }
}