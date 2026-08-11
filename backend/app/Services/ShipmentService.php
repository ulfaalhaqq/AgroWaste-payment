<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Shipment;
use Illuminate\Support\Facades\Auth;

class ShipmentService
{
    /**
     * Ambil semua jadwal pengiriman khusus untuk kurir yang sedang login
     */
    public function getShipmentsForLogistik()
    {
        $user = Auth::user();
        if (!$user) {
            return collect();
        }

        // 1. Otomatis buat LogistikProfile jika user role logistik belum memilikinya di DB
        $logistikProfile = $user->logistikProfile;
        if (!$logistikProfile && $user->role === 'logistik') {
            $logistikProfile = \App\Models\LogistikProfile::firstOrCreate(
                ['user_id' => $user->id],
                [
                    'id'                => \Illuminate\Support\Str::uuid()->toString(),
                    'jenis_kendaraan'   => 'Motor',
                    'plat_nomor'        => 'N 1234 AGW',
                    'kapasitas_maks_kg' => 25,
                    'is_available'      => true,
                ]
            );
        }

        if (!$logistikProfile) {
            $logistikProfile = \App\Models\LogistikProfile::first();
        }

        $logistikProfileId = $logistikProfile ? $logistikProfile->id : null;

        // 2. Hubungkan semua pesanan ber-metode logistik ke daftar pengiriman kurir
        $logistikOrders = \App\Models\Order::with(['peternak.peternakProfile'])
            ->where('metode_pengiriman', 'logistik')
            ->whereIn('status', ['dikonfirmasi', 'dikirim', 'selesai'])
            ->get();

        foreach ($logistikOrders as $ord) {
            $shipment = \App\Models\Shipment::where('order_id', $ord->id)->first();
            if (!$shipment) {
                $closestCourier = self::findClosestCourierForOrder($ord);
                \App\Models\Shipment::create([
                    'id'                  => \Illuminate\Support\Str::uuid()->toString(),
                    'order_id'            => $ord->id,
                    'logistik_profile_id' => $closestCourier ? $closestCourier->id : $logistikProfileId,
                    'status'              => $ord->status === 'dikirim' ? 'sedang_berjalan' : ($ord->status === 'selesai' ? 'selesai' : 'dijadwalkan'),
                ]);
                if ($ord->status === 'dikonfirmasi') {
                    $ord->update(['status' => 'dikirim']);
                }
            } else if (!$shipment->logistik_profile_id) {
                $closestCourier = self::findClosestCourierForOrder($ord);
                if ($closestCourier) {
                    $shipment->update(['logistik_profile_id' => $closestCourier->id]);
                    if ($ord->status === 'dikonfirmasi') {
                        $ord->update(['status' => 'dikirim']);
                    }
                }
            }
        }

        // 3. Ambil seluruh data pengiriman untuk kurir ini
        return Shipment::with([
            'order.items.product.peternakProfile',
            'order.user',
            'order.peternak.peternakProfile'
        ])
            ->where(function ($q) use ($logistikProfileId) {
                if ($logistikProfileId) {
                    $q->where('logistik_profile_id', $logistikProfileId)
                      ->orWhereNull('logistik_profile_id');
                }
            })
            ->orderBy('created_at', 'desc')
            ->get();
    }

    /* Update status pengiriman */
    public function updateStatus(string $shipmentId, array $data): Shipment
    {
        $user = Auth::user();
        $logistikProfile = $user ? $user->logistikProfile : null;
        $logistikProfileId = $logistikProfile ? $logistikProfile->id : null;

        $shipmentQuery = Shipment::with('order');
        if ($logistikProfileId) {
            $shipmentQuery->where(function ($q) use ($logistikProfileId) {
                $q->where('logistik_profile_id', $logistikProfileId)
                  ->orWhereNull('logistik_profile_id');
            });
        }

        $shipment = $shipmentQuery->findOrFail($shipmentId);

        $shipment->update([
            'status'               => $data['status'],
            'tracking_notes'       => $data['tracking_notes'] ?? $shipment->tracking_notes,
            'logistik_profile_id' => $logistikProfileId ?? $shipment->logistik_profile_id,
        ]);

        if ($shipment->order) {
            if ($data['status'] === 'selesai' || $data['status'] === 'terkirim') {
                $shipment->order->update(['status' => 'dikirim']);
            } else if ($data['status'] === 'sedang_berjalan' || $data['status'] === 'dalam_perjalanan') {
                $shipment->order->update(['status' => 'dikirim']);
            }

            app(\App\Services\NotificationService::class)->send(
                $shipment->order->user_id,
                'PENGIRIMAN_UPDATE',
                'Update Pengiriman',
                "Status paketmu sekarang: {$data['status']}."
            );
        }

        return $shipment;
    }

    /**
     * Cari kurir logistik terdekat berdasarkan koordinat GPS / wilayah
     */
    public static function findClosestCourierForOrder($order)
    {
        $couriers = \App\Models\LogistikProfile::all();
        if ($couriers->isEmpty()) {
            return null;
        }

        $sellerLat = $order->peternak?->peternakProfile?->lat ?? null;
        $sellerLng = $order->peternak?->peternakProfile?->lng ?? null;
        $sellerKab = strtolower((string)($order->peternak?->peternakProfile?->kabupaten ?? ''));

        if (!is_null($sellerLat) && !is_null($sellerLng)) {
            $nLat1 = (float)$sellerLat;
            $nLng1 = (float)$sellerLng;

            $bestCourier = null;
            $minDistance = null;

            foreach ($couriers as $c) {
                if (!is_null($c->lat) && !is_null($c->lng)) {
                    $nLat2 = (float)$c->lat;
                    $nLng2 = (float)$c->lng;

                    $dLat = deg2rad($nLat2 - $nLat1);
                    $dLng = deg2rad($nLng2 - $nLng1);
                    $a = sin($dLat / 2) * sin($dLat / 2) +
                         cos(deg2rad($nLat1)) * cos(deg2rad($nLat2)) *
                         sin($dLng / 2) * sin($dLng / 2);
                    $dist = 6371 * 2 * atan2(sqrt($a), sqrt(1 - $a));

                    if (is_null($minDistance) || $dist < $minDistance) {
                        $minDistance = $dist;
                        $bestCourier = $c;
                    }
                }
            }

            if ($bestCourier) {
                return $bestCourier;
            }
        }

        if ($sellerKab) {
            foreach ($couriers as $c) {
                if ($c->kabupaten && str_contains(strtolower($c->kabupaten), $sellerKab)) {
                    return $c;
                }
            }
        }

        return $couriers->first();
    }
}