<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AdminSeeder extends Seeder
{
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => 'admin@agrowaste.com'], // kunci pencarian, tidak akan bikin duplikat
            [
                'id' => Str::uuid()->toString(),
                'name' => 'Admin Agrowaste',
                'password' => Hash::make('admin321'),
                'role' => 'admin',
            ]
        );

        $this->command->info('Akun admin berhasil dibuat/diperbarui.');
    }
}