<?php

// Konfigurasi khusus bisnis AgroWaste yang tidak terkait Midtrans,
// seperti rekening tujuan pembayaran manual & setoran COD.
return [
    'admin_bank' => [
        'bank_name'     => env('ADMIN_BANK_NAME', 'BCA'),
        'account_number'=> env('ADMIN_BANK_ACCOUNT_NUMBER', ''),
        'account_name'  => env('ADMIN_BANK_ACCOUNT_NAME', 'AgroWaste Indonesia'),
    ],

    // Persentase fee platform, dipotong dari subtotal_produk saja.
    'platform_fee_percent' => (float) env('PLATFORM_FEE_PERCENT', 5),

    // Aturan penarikan saldo wallet.
    'withdrawal' => [
        'minimum' => (float) env('WITHDRAWAL_MINIMUM', 20000),
        'fee'     => (float) env('WITHDRAWAL_FEE', 2500),
        'min_hours_between' => (int) env('WITHDRAWAL_MIN_HOURS', 24),
    ],
];