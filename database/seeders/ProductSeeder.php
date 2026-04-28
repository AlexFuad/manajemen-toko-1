<?php

namespace Database\Seeders;

use App\Models\Product;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class ProductSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Buat 20 produk contoh
        Product::factory()->count(20)->create();

        // Atau buat produk spesifik
        Product::create([
            'name' => 'Indomie Goreng',
            'category' => 'Makanan',
            'price' => 3500,
            'cost' => 2800,
            'stock' => 50,
            'unit' => 'pcs',
            'is_active' => true,
        ]);

        Product::create([
            'name' => 'Aqua 600ml',
            'category' => 'Minuman',
            'price' => 4000,
            'cost' => 3000,
            'stock' => 100,
            'unit' => 'botol',
            'is_active' => true,
        ]);

        Product::create([
            'name' => 'Chitato 68g',
            'category' => 'Snack',
            'price' => 10000,
            'cost' => 7500,
            'stock' => 30,
            'unit' => 'pack',
            'is_active' => true,
        ]);
    }
}
