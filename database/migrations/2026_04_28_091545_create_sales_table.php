<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('sales', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->string('customer_name')->nullable();
            $table->decimal('total_amount', 12, 2);
            $table->decimal('discount', 10, 2)->default(0);
            $table->decimal('final_amount', 12, 2);
            $table->enum('payment_type', ['cash', 'transfer', 'card']);
            $table->decimal('payment_amount', 12, 2);
            $table->decimal('change', 12, 2)->default(0);
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sales');
    }
};
