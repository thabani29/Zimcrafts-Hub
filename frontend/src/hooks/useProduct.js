// frontend/src/hooks/useProducts.js
import { useState, useEffect } from 'react';
import apiService from '../services/api';

export const useProducts = (initialParams = {}) => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [params, setParams] = useState(initialParams);

    useEffect(() => {
        fetchProducts();
    }, [JSON.stringify(params)]);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const response = await apiService.getProducts(params);
            setProducts(response.data || response.products || []);
            setError(null);
        } catch (err) {
            setError(err.message || 'Failed to fetch products');
        } finally {
            setLoading(false);
        }
    };

    const refetch = () => {
        fetchProducts();
    };

    return { products, loading, error, refetch, setParams, params };
};

// frontend/src/hooks/useProduct.js
export const useProduct = (id) => {
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (id) {
            fetchProduct();
        }
    }, [id]);

    const fetchProduct = async () => {
        try {
            setLoading(true);
            const response = await apiService.getProductById(id);
            setProduct(response.data || response.product);
            setError(null);
        } catch (err) {
            setError(err.message || 'Failed to fetch product');
        } finally {
            setLoading(false);
        }
    };

    return { product, loading, error, refetch: fetchProduct };
};