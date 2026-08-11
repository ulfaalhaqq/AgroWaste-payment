<?php

return [
    // Faktor konversi emisi CO2eq (kg) per kg limbah ternak (Berdasarkan metodologi IPCC)
    'co2_factors' => [
        'sapi'    => 0.98,
        'ayam'    => 0.616,
        'kambing' => 0.784,
        'babi'    => 0.672,
        'domba'   => 0.756,
        'kuda'    => 0.840,
        'lainnya' => 0.050,
    ],
    
    // Asumsi serapan karbon 1 pohon dewasa per tahun (kg)
    'pohon_co2_per_tahun_kg' => 21,  
    
    // Threshold (batas minimum kg terjual) untuk mendapatkan badge
    'badge_thresholds' => [
        'peternak_hijau' => 100,
        'agen_iklim'     => 500,
        'pahlawan_bumi'  => 1000,
    ],
];