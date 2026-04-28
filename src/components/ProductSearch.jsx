import { useState, useEffect } from 'react';
import { productsApi } from '../api/products';

const ProductSearch = ({ onAddToCart }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');

  const fetchProducts = async (search = '', category = '') => {
    setLoading(true);
    try {
      const params = {
        search,
        category,
        is_active: true,
        per_page: 20,
      };
      const response = await productsApi.getProducts(params);
      
      if (response.success) {
        setProducts(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchProducts(searchTerm, selectedCategory);
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchTerm, selectedCategory]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleCategoryChange = (e) => {
    setSelectedCategory(e.target.value);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStockStatus = (stock) => {
    if (stock === 0) return { text: 'Out of Stock', color: 'bg-red-100 text-red-800', disabled: true };
    if (stock <= 10) return { text: 'Low Stock', color: 'bg-yellow-100 text-yellow-800', disabled: false };
    return { text: 'In Stock', color: 'bg-green-100 text-green-800', disabled: false };
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Products</h2>
      
      {/* Search and Filter */}
      <div className="mb-4 space-y-3">
        <input
          type="text"
          value={searchTerm}
          onChange={handleSearch}
          placeholder="Search products..."
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={selectedCategory}
          onChange={handleCategoryChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Categories</option>
          <option value="Makanan">Makanan</option>
          <option value="Minuman">Minuman</option>
          <option value="Snack">Snack</option>
          <option value="Lainnya">Lainnya</option>
        </select>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-96 overflow-y-auto">
        {loading ? (
          <div className="col-span-full text-center py-8 text-gray-600">Loading...</div>
        ) : products.length === 0 ? (
          <div className="col-span-full text-center py-8 text-gray-600">No products found</div>
        ) : (
          products.map((product) => {
            const stockStatus = getStockStatus(product.stock);
            return (
              <div
                key={product.id}
                className={`border rounded-lg p-4 cursor-pointer transition-all hover:shadow-lg ${
                  stockStatus.disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-blue-500'
                }`}
                onClick={() => !stockStatus.disabled && onAddToCart(product)}
              >
                <div className="mb-2">
                  <h3 className="font-semibold text-gray-800 text-sm line-clamp-2">{product.name}</h3>
                  <p className="text-xs text-gray-500">{product.category}</p>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-bold text-blue-600">{formatCurrency(product.price)}</span>
                  <span className={`text-xs px-2 py-1 rounded-full ${stockStatus.color}`}>
                    {stockStatus.text}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">Stock: {product.stock} {product.unit}</p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ProductSearch;
