<?php

namespace Database\Factories;

use App\Models\Product;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Product>
 */
class ProductFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $categories = ['Makanan', 'Minuman', 'Snack', 'Bumbu Dapur', 'Perlengkapan'];
        $units = ['pcs', 'kg', 'liter', 'pack', 'botol', 'kaleng'];
        
        return [
            'name' => fake()->words(3, true),
            'category' => fake()->randomElement($categories),
            'price' => fake()->randomFloat(2, 5000, 500000),
            'cost' => fake()->randomFloat(2, 3000, 300000),
            'stock' => fake()->numberBetween(0, 100),
            'unit' => fake()->randomElement($units),
            'is_active' => true,
        ];
    }
}
