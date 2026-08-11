<?php

namespace App\Enums;

enum UserRole: string
{
    case ADMIN    = 'admin';
    case PETERNAK = 'peternak';
    case PEMBELI  = 'pembeli';
}