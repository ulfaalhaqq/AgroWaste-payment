<?php

namespace App\Enums;

enum OrderStatus: string
{
    case MENUNGGU_PEMBAYARAN  = 'menunggu_pembayaran';
    case MENUNGGU_KONFIRMASI  = 'menunggu_konfirmasi';
    case DIKONFIRMASI         = 'dikonfirmasi';
    case DALAM_PENGIRIMAN     = 'dalam_pengiriman';
    case SELESAI              = 'selesai';
    case DITOLAK              = 'ditolak';
    case DIBATALKAN           = 'dibatalkan';
}