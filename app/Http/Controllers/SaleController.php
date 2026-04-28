<?php

namespace App\Http\Controllers;

use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class SaleController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = Sale::with(['items.product', 'user']);

        // Filter by date range
        if ($request->has('start_date') && $request->has('end_date')) {
            $query->whereBetween('created_at', [$request->start_date, $request->end_date]);
        }

        // Filter by user
        if ($request->has('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        // Pagination
        $perPage = $request->get('per_page', 15);
        $sales = $query->orderBy('created_at', 'desc')->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $sales
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'customer_name' => 'nullable|string|max:255',
            'discount' => 'numeric|min:0',
            'payment_type' => 'required|in:cash,transfer,card',
            'payment_amount' => 'required|numeric|min:0',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.price' => 'required|numeric|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        DB::beginTransaction();
        try {
            // Calculate total amount
            $totalAmount = 0;
            foreach ($request->items as $item) {
                $totalAmount += $item['quantity'] * $item['price'];
            }

            // Calculate final amount
            $discount = $request->discount ?? 0;
            $finalAmount = $totalAmount - $discount;
            $paymentAmount = $request->payment_amount;
            $change = $paymentAmount - $finalAmount;

            // Generate sale code
            $code = 'SALE-' . date('Ymd') . '-' . str_pad(Sale::count() + 1, 4, '0', STR_PAD_LEFT);

            // Create sale
            $sale = Sale::create([
                'code' => $code,
                'customer_name' => $request->customer_name,
                'total_amount' => $totalAmount,
                'discount' => $discount,
                'final_amount' => $finalAmount,
                'payment_type' => $request->payment_type,
                'payment_amount' => $paymentAmount,
                'change' => $change,
                'user_id' => $request->user()->id,
            ]);

            // Create sale items and update product stock
            foreach ($request->items as $item) {
                $product = Product::find($item['product_id']);
                
                // Check stock
                if ($product->stock < $item['quantity']) {
                    DB::rollBack();
                    return response()->json([
                        'success' => false,
                        'message' => "Insufficient stock for product: {$product->name}"
                    ], 400);
                }

                $subtotal = $item['quantity'] * $item['price'];

                SaleItem::create([
                    'sale_id' => $sale->id,
                    'product_id' => $item['product_id'],
                    'quantity' => $item['quantity'],
                    'price' => $item['price'],
                    'subtotal' => $subtotal,
                ]);

                // Update product stock
                $product->decrement('stock', $item['quantity']);
            }

            DB::commit();

            $sale->load('items.product');

            return response()->json([
                'success' => true,
                'message' => 'Sale created successfully',
                'data' => $sale
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to create sale',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $sale = Sale::with(['items.product', 'user'])->find($id);

        if (!$sale) {
            return response()->json([
                'success' => false,
                'message' => 'Sale not found'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $sale
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        return response()->json([
            'success' => false,
            'message' => 'Sales cannot be updated after creation'
        ], 403);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        return response()->json([
            'success' => false,
            'message' => 'Sales cannot be deleted'
        ], 403);
    }
}
