<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;

class CategorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $categories = [
            [
                'name' => 'Kotoran Padat',
                'slug' => 'kotoran_padat',
                'description' => 'Limbah kotoran ternak padat (sapi, kambing, ayam) untuk pupuk organik.',
            ],
            [
                'name' => 'Limbah Cair',
                'slug' => 'limbah_cair',
                'description' => 'Limbah cair hasil peternakan, termasuk urine dan air limbah kandang.',
            ],
            [
                'name' => 'Limbah Olahan',
                'slug' => 'limbah_olahan',
                'description' => 'Limbah yang sudah diolah lebih lanjut, seperti kompos dan pupuk fermentasi.',
            ],
        ];

        foreach ($categories as $item) {
            Category::updateOrCreate(
                ['slug' => $item['slug']],
                [
                    'name' => $item['name'],
                    'description' => $item['description'],
                ]
            );
        }
    }
}