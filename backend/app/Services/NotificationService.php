<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Notification;
use Illuminate\Support\Facades\Auth;

class NotificationService
{
    /**
     * Mengambil notifikasi yang belum dibaca untuk user yang login
     */
    public function getUnread()
    {
        return Notification::where('user_id', Auth::id())
            ->where('is_read', false)
            ->orderBy('created_at', 'desc')
            ->get();
    }

    /**
     * Menandai notifikasi sebagai sudah dibaca
     */
    public function markAsRead(string $id): Notification
    {
        $notification = Notification::where('user_id', Auth::id())->findOrFail($id);
        $notification->update(['is_read' => true]);
        
        return $notification;
    }

    /**
     * Fungsi helper untuk mengirim notifikasi baru (bisa dipanggil dari Service lain)
     */
    public function send(string $userId, string $type, string $title, string $message): Notification
    {
        return Notification::create([
            'user_id' => $userId,
            'type'    => $type,
            'title'   => $title,
            'message' => $message,
            'is_read' => false,
        ]);
    }
}