<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MpWebhookReceipt extends Model
{
    use HasFactory;

    protected $table = 'mp_webhook_receipts';

    protected $fillable = [
        'topic',
        'resource',
        'resource_id',
        'payload_hash',
        'raw_payload',
        'received_at',
        'processed',
    ];

    protected $casts = [
        'raw_payload' => 'array',
        'received_at' => 'datetime',
        'processed' => 'boolean',
    ];
}
