<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\Sale;
use App\Models\SaleItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    /**
     * Stock report - rekap stok produk dengan status
     */
    public function stock(Request $request)
    {
        $query = Product::select('id', 'name', 'category', 'stock', 'unit', 'is_active');

        // Filter by category
        if ($request->has('category')) {
            $query->where('category', $request->category);
        }

        // Filter by is_active
        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        $products = $query->get()->map(function ($product) {
            $status = 'in_stock';
            if ($product->stock == 0) {
                $status = 'stock_out';
            } elseif ($product->stock <= 10) {
                $status = 'low_stock';
            }

            return [
                'id' => $product->id,
                'name' => $product->name,
                'category' => $product->category,
                'stock' => $product->stock,
                'unit' => $product->unit,
                'status' => $status,
                'is_active' => $product->is_active,
            ];
        });

        // Summary
        $summary = [
            'total_products' => $products->count(),
            'in_stock' => $products->where('status', 'in_stock')->count(),
            'low_stock' => $products->where('status', 'low_stock')->count(),
            'stock_out' => $products->where('status', 'stock_out')->count(),
        ];

        return response()->json([
            'success' => true,
            'data' => [
                'summary' => $summary,
                'products' => $products
            ]
        ]);
    }

    /**
     * Sales report - laporan penjualan harian/bulanan
     */
    public function sales(Request $request)
    {
        $type = $request->get('type', 'daily'); // daily or monthly
        $startDate = $request->get('start_date');
        $endDate = $request->get('end_date');

        $query = Sale::query();

        if ($startDate && $endDate) {
            $query->whereBetween('created_at', [$startDate, $endDate]);
        } elseif ($type === 'daily') {
            $query->whereDate('created_at', today());
        } elseif ($type === 'monthly') {
            $query->whereYear('created_at', now()->year)
                  ->whereMonth('created_at', now()->month);
        }

        $sales = $query->get();

        $totalRevenue = $sales->sum('final_amount');
        $totalSalesCount = $sales->count();
        $avgTransactionValue = $totalSalesCount > 0 ? $totalRevenue / $totalSalesCount : 0;

        // Group by date for daily report
        if ($type === 'daily' && !$startDate) {
            $salesByDate = Sale::select(
                    DB::raw('DATE(created_at) as date'),
                    DB::raw('COUNT(*) as sales_count'),
                    DB::raw('SUM(final_amount) as revenue')
                )
                ->whereDate('created_at', today())
                ->groupBy('date')
                ->first();

            return response()->json([
                'success' => true,
                'data' => [
                    'type' => 'daily',
                    'date' => today()->toDateString(),
                    'total_revenue' => (float) $totalRevenue,
                    'total_sales_count' => $totalSalesCount,
                    'avg_transaction_value' => (float) $avgTransactionValue,
                    'details' => $salesByDate ? [
                        'date' => $salesByDate->date,
                        'sales_count' => $salesByDate->sales_count,
                        'revenue' => (float) $salesByDate->revenue
                    ] : null
                ]
            ]);
        }

        // Group by month for monthly report
        if ($type === 'monthly' && !$startDate) {
            $salesByMonth = Sale::select(
                    DB::raw('YEAR(created_at) as year'),
                    DB::raw('MONTH(created_at) as month'),
                    DB::raw('COUNT(*) as sales_count'),
                    DB::raw('SUM(final_amount) as revenue')
                )
                ->whereYear('created_at', now()->year)
                ->whereMonth('created_at', now()->month)
                ->groupBy('year', 'month')
                ->first();

            return response()->json([
                'success' => true,
                'data' => [
                    'type' => 'monthly',
                    'year' => now()->year,
                    'month' => now()->month,
                    'month_name' => now()->format('F'),
                    'total_revenue' => (float) $totalRevenue,
                    'total_sales_count' => $totalSalesCount,
                    'avg_transaction_value' => (float) $avgTransactionValue,
                    'details' => $salesByMonth ? [
                        'year' => $salesByMonth->year,
                        'month' => $salesByMonth->month,
                        'sales_count' => $salesByMonth->sales_count,
                        'revenue' => (float) $salesByMonth->revenue
                    ] : null
                ]
            ]);
        }

        // Custom date range
        $salesByDate = Sale::select(
                DB::raw('DATE(created_at) as date'),
                DB::raw('COUNT(*) as sales_count'),
                DB::raw('SUM(final_amount) as revenue')
            )
            ->whereBetween('created_at', [$startDate, $endDate])
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'type' => 'custom_range',
                'start_date' => $startDate,
                'end_date' => $endDate,
                'total_revenue' => (float) $totalRevenue,
                'total_sales_count' => $totalSalesCount,
                'avg_transaction_value' => (float) $avgTransactionValue,
                'daily_breakdown' => $salesByDate->map(function ($item) {
                    return [
                        'date' => $item->date,
                        'sales_count' => $item->sales_count,
                        'revenue' => (float) $item->revenue
                    ];
                })
            ]
        ]);
    }

    /**
     * Profit report - laporan laba rugi ringkas
     */
    public function profit(Request $request)
    {
        $type = $request->get('type', 'daily'); // daily or monthly
        $startDate = $request->get('start_date');
        $endDate = $request->get('end_date');

        $query = Sale::with('items');

        if ($startDate && $endDate) {
            $query->whereBetween('created_at', [$startDate, $endDate]);
        } elseif ($type === 'daily') {
            $query->whereDate('created_at', today());
        } elseif ($type === 'monthly') {
            $query->whereYear('created_at', now()->year)
                  ->whereMonth('created_at', now()->month);
        }

        $sales = $query->get();

        $totalRevenue = $sales->sum('final_amount');
        $totalCost = 0;

        foreach ($sales as $sale) {
            foreach ($sale->items as $item) {
                // Get product cost at time of sale (assuming cost is stored in products table)
                $product = Product::find($item->product_id);
                if ($product) {
                    $totalCost += $product->cost * $item->quantity;
                }
            }
        }

        $totalProfit = $totalRevenue - $totalCost;
        $profitMargin = $totalRevenue > 0 ? ($totalProfit / $totalRevenue) * 100 : 0;

        return response()->json([
            'success' => true,
            'data' => [
                'type' => $type,
                'period' => $startDate && $endDate 
                    ? "{$startDate} to {$endDate}" 
                    : ($type === 'daily' ? today()->toDateString() : now()->format('F Y')),
                'total_revenue' => (float) $totalRevenue,
                'total_cost' => (float) $totalCost,
                'total_profit' => (float) $totalProfit,
                'profit_margin' => (float) number_format($profitMargin, 2),
                'profit_percentage' => (float) number_format($profitMargin, 2) . '%',
                'sales_count' => $sales->count()
            ]
        ]);
    }
}
