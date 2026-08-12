<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Auth\Notifications\ResetPassword; // tambah ini

#[Fillable(['id', 'name', 'email', 'password', 'role', 'phone', 'avatar_url'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;
    public $incrementing = false;
    protected $keyType = 'string';

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function peternakProfile()
    {
        return $this->hasOne(PeternakProfile::class);
    }

    public function buyerProfile()
    {
        return $this->hasOne(BuyerProfile::class);
    }

    public function logistikProfile()
    {
        return $this->hasOne(LogistikProfile::class);
    }

    // Tambahkan ini
    public function sendPasswordResetNotification($token)
    {
        $url = env('FRONTEND_URL') . '/reset-password?token=' . $token . '&email=' . urlencode($this->email);

        ResetPassword::createUrlUsing(function () use ($url) {
            return $url;
        });

        $this->notify(new ResetPassword($token));
    }
}