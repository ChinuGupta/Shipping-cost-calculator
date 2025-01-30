import React, { useState, useEffect } from 'react';
import { createClient } from 'contentful';
import './App.css';

const App = () => {
  const [warehouses, setWarehouses] = useState([]);
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [shippingOptions, setShippingOptions] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false); 

  const client = createClient({
    space: 'y7wdat051ol0',
    accessToken: 'wuLKc8OEuVm1VJe70nrzIAaNu71Bg9UV9XRQMkqkV_o',
  });

  useEffect(() => {
    const fetchWarehouses = async () => {
      try {
        const response = await client.getEntries({
          content_type: 'warehouseModel',
        });

        const warehouseNames = response.items.map(item => item.fields.name);
        setWarehouses(warehouseNames);
      } catch (err) {
        setError('Error fetching warehouses.');
      }
    };

    fetchWarehouses();
  }, []);

  // Handle form submission
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setShippingOptions(null);
    setError('');
    setLoading(true); // Start loading

    if (origin === destination) {
      setError('Origin and Destination cannot be the same.');
      setLoading(false); // Stop loading
      return;
    }

    try {
      const response = await fetch(`http://localhost:3000/shipping?origin=${origin}&destination=${destination}`);
      const data = await response.json();

      if (response.ok) {
        setShippingOptions(data);
      } else {
        setError(data.error || 'An error occurred.');
      }
    } catch (err) {
      setError('Error connecting to the server.');
    }

    setLoading(false); 
  };

  return (
    <div className="app-container">
      <h1>Shipping Calculator</h1>
      <form onSubmit={handleFormSubmit} className="form-container">
        <div className="form-group">
          <label>Origin City: </label>
          <select value={origin} onChange={(e) => setOrigin(e.target.value)} required>
            <option value="">Select Origin</option>
            {warehouses.map((warehouse, index) => (
              <option key={index} value={warehouse}>
                {warehouse}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Destination City: </label>
          <select value={destination} onChange={(e) => setDestination(e.target.value)} required>
            <option value="">Select Destination</option>
            {warehouses.map((warehouse, index) => (
              <option key={index} value={warehouse}>
                {warehouse}
              </option>
            ))}
          </select>
        </div>

        <button type="submit" className="submit-btn" disabled={loading}>
          {loading ? 'Fetching Shipping Routes...' : 'Get Shipping Routes'}
        </button>
      </form>

      {error && <p className="error-message">{error}</p>}

      {shippingOptions && (
        <div className="result-container">
          <h2>Shipping Options</h2>
          <div className="option">
            <strong>Cheapest:</strong> {shippingOptions.cheapest.transport_mode} ({shippingOptions.cheapest.cost} ₹, {shippingOptions.cheapest.time_hours} hours)
          </div>
          <div className="option">
            <strong>Fastest:</strong> {shippingOptions.fastest.transport_mode} ({shippingOptions.fastest.cost} ₹, {shippingOptions.fastest.time_hours} hours)
          </div>
          <div className="option">
            <strong>Best Option:</strong> {shippingOptions.best.transport_mode} (Cost: {shippingOptions.best.cost} ₹, Time: {shippingOptions.best.time_hours} hours)
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
