import { useState, useReducer } from 'react';
import { useNavigate } from 'react-router-dom';
import ProductSearch from '../components/ProductSearch';
import CartTable from '../components/CartTable';
import { salesApi } from '../api/sales';

// Cart reducer for managing cart state
const cartReducer = (state, action) => {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existingItem = state.find(item => item.id === action.payload.id);
      
      if (existingItem) {
        // Check if adding would exceed stock
        if (existingItem.quantity + 1 > existingItem.stock) {
          return state;
        }
        return state.map(item =>
          item.id === action.payload.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      
      return [...state, { ...action.payload, quantity: 1 }];
    }

    case 'UPDATE_QUANTITY': {
      const { id, quantity } = action.payload;
      
      if (quantity <= 0) {
        return state.filter(item => item.id !== id);
      }
      
      return state.map(item => {
        if (item.id === id) {
          // Ensure quantity doesn't exceed stock
          const newQuantity = Math.min(quantity, item.stock);
          return { ...item, quantity: newQuantity };
        }
        return item;
      });
    }

    case 'REMOVE_ITEM': {
      return state.filter(item => item.id !== action.payload);
    }

    case 'CLEAR_CART': {
      return [];
    }

    default:
      return state;
  }
};

const CashierPage = () => {
  const [cart, dispatch] = useReducer(cartReducer, []);
  const [customerName, setCustomerName] = useState('');
  const [discount, setDiscount] = useState(0);
  const [paymentType, setPaymentType] = useState('cash');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [saleResult, setSaleResult] = useState(null);

  const navigate = useNavigate();

  const addToCart = (product) => {
    dispatch({ type: 'ADD_ITEM', payload: product });
  };

  const updateQuantity = (id, quantity) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { id, quantity } });
  };

  const removeItem = (id) => {
    dispatch({ type: 'REMOVE_ITEM', payload: id });
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
    setCustomerName('');
    setDiscount(0);
    setPaymentAmount('');
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const calculateSubtotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    return Math.max(0, subtotal - discount);
  };

  const calculateChange = () => {
    const total = calculateTotal();
    const paid = parseFloat(paymentAmount) || 0;
    return paid - total;
  };

  const handleSubmitSale = async (e) => {
    e.preventDefault();
    
    if (cart.length === 0) {
      alert('Cart is empty. Please add products.');
      return;
    }

    const total = calculateTotal();
    const paid = parseFloat(paymentAmount) || 0;

    if (paid < total) {
      alert('Payment amount is insufficient.');
      return;
    }

    setIsProcessing(true);

    try {
      const saleData = {
        customer_name: customerName || null,
        discount: discount,
        payment_type: paymentType,
        payment_amount: paid,
        items: cart.map(item => ({
          product_id: item.id,
          quantity: item.quantity,
          price: item.price,
        })),
      };

      const response = await salesApi.createSale(saleData);

      if (response.success) {
        setSaleResult(response.data);
        setShowSuccess(true);
        clearCart();
      }
    } catch (error) {
      console.error('Error creating sale:', error);
      alert('Failed to create sale. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleNewSale = () => {
    setShowSuccess(false);
    setSaleResult(null);
  };

  // Success Modal
  if (showSuccess && saleResult) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-8">
        <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Payment Successful!</h2>
          <p className="text-gray-600 mb-6">Transaction completed successfully</p>
          
          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">Sale Code:</span>
              <span className="font-semibold">{saleResult.code}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">Total Amount:</span>
              <span className="font-semibold">{formatCurrency(saleResult.final_amount)}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">Payment:</span>
              <span className="font-semibold">{formatCurrency(saleResult.payment_amount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Change:</span>
              <span className="font-semibold text-green-600">{formatCurrency(saleResult.change)}</span>
            </div>
          </div>

          <button
            onClick={handleNewSale}
            className="w-full bg-blue-600 text-white py-3 rounded-md hover:bg-blue-700 transition-colors font-semibold"
          >
            New Sale
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Point of Sale</h1>
          <button
            onClick={() => navigate('/dashboard')}
            className="text-gray-600 hover:text-gray-800 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Side - Product Search */}
          <div>
            <ProductSearch onAddToCart={addToCart} />
          </div>

          {/* Right Side - Cart and Payment */}
          <div className="space-y-6">
            <CartTable
              cart={cart}
              onUpdateQuantity={updateQuantity}
              onRemoveItem={removeItem}
              onClearCart={clearCart}
            />

            {/* Payment Form */}
            {cart.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Payment</h2>
                
                <form onSubmit={handleSubmitSale} className="space-y-4">
                  {/* Customer Name */}
                  <div>
                    <label htmlFor="customerName" className="block text-sm font-medium text-gray-700 mb-1">
                      Customer Name (Optional)
                    </label>
                    <input
                      type="text"
                      id="customerName"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter customer name"
                    />
                  </div>

                  {/* Discount */}
                  <div>
                    <label htmlFor="discount" className="block text-sm font-medium text-gray-700 mb-1">
                      Discount
                    </label>
                    <input
                      type="number"
                      id="discount"
                      value={discount}
                      onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                      min="0"
                      step="1000"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0"
                    />
                  </div>

                  {/* Payment Type */}
                  <div>
                    <label htmlFor="paymentType" className="block text-sm font-medium text-gray-700 mb-1">
                      Payment Type
                    </label>
                    <select
                      id="paymentType"
                      value={paymentType}
                      onChange={(e) => setPaymentType(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="cash">Cash</option>
                      <option value="qris">QRIS</option>
                      <option value="transfer">Bank Transfer</option>
                      <option value="card">Credit/Debit Card</option>
                      <option value="e-wallet">E-Wallet</option>
                    </select>
                  </div>

                  {/* Payment Amount */}
                  <div>
                    <label htmlFor="paymentAmount" className="block text-sm font-medium text-gray-700 mb-1">
                      Payment Amount
                    </label>
                    <input
                      type="number"
                      id="paymentAmount"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      min="0"
                      step="1000"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg font-semibold"
                      placeholder="Enter amount"
                    />
                  </div>

                  {/* Summary */}
                  <div className="border-t pt-4 space-y-2 bg-gray-50 rounded-lg p-4">
                    <div className="flex justify-between text-gray-600">
                      <span>Subtotal</span>
                      <span>{formatCurrency(calculateSubtotal())}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Discount</span>
                      <span>-{formatCurrency(discount)}</span>
                    </div>
                    <div className="flex justify-between text-xl font-bold text-gray-800 pt-2 border-t">
                      <span>Total</span>
                      <span>{formatCurrency(calculateTotal())}</span>
                    </div>
                    {paymentAmount && (
                      <div className="flex justify-between text-gray-600">
                        <span>Change</span>
                        <span className={calculateChange() >= 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                          {formatCurrency(calculateChange())}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isProcessing || cart.length === 0}
                    className="w-full bg-green-600 text-white py-3 rounded-md hover:bg-green-700 transition-colors font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isProcessing ? 'Processing...' : 'Pay Now'}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CashierPage;
