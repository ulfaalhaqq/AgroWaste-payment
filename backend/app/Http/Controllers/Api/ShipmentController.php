<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateShipmentStatusRequest;
use App\Services\ShipmentService;
use Illuminate\Http\JsonResponse;

class ShipmentController extends Controller
{
    public function __construct(protected ShipmentService $shipmentService) {}

    public function index(): JsonResponse
    {
        $shipments = $this->shipmentService->getShipmentsForLogistik();

        return response()->json([
            'success' => true,
            'message' => 'Daftar pengiriman berhasil diambil.',
            'data'    => $shipments
        ], 200);
    }

    public function updateStatus(UpdateShipmentStatusRequest $request, string $id): JsonResponse
    {
        $shipment = $this->shipmentService->updateStatus($id, $request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Status pengiriman berhasil diperbarui menjadi ' . $shipment->status,
            'data'    => $shipment
        ], 200);
    }
}