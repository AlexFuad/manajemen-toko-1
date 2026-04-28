<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\SaleController;
use App\Http\Controllers\ReportController;

// Public routes
Route::post('/login', [AuthController::class, 'login']);
Route::post('/register', [AuthController::class, 'register']);

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
    
    // Product routes
    Route::apiResource('products', ProductController::class);
    
    // Sales routes
    Route::get('/sales', [SaleController::class, 'index']);
    Route::post('/sales', [SaleController::class, 'store']);
    Route::get('/sales/{id}', [SaleController::class, 'show']);
    
    // Report routes
    Route::get('/stock', [ReportController::class, 'stock']);
    Route::get('/reports/sales', [ReportController::class, 'sales']);
    Route::get('/reports/profit', [ReportController::class, 'profit']);
    
    // Example of role-based routes
    Route::middleware('role:admin')->group(function () {
        // Admin only routes
        Route::get('/admin/dashboard', function () {
            return response()->json(['message' => 'Admin dashboard']);
        });
    });
    
    Route::middleware('role:kasir')->group(function () {
        // Cashier only routes
        Route::get('/kasier/pos', function () {
            return response()->json(['message' => 'Cashier POS']);
        });
    });
    
    Route::middleware('role:owner')->group(function () {
        // Owner only routes
        Route::get('/owner/reports', function () {
            return response()->json(['message' => 'Owner reports']);
        });
    });
});
