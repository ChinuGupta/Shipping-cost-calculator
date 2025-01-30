import React, { useState, useEffect } from 'react';
import { createClient } from 'contentful';
import './App.css';

const App = () => {
  const [warehouses, setWarehouses] = useState([]);
  const [destinations, setDestinations] = useState([]);
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [shippingOptions, setShippingOptions] = useState(null);
  const [error, setError] = useState('');

  const client = createClient({
    space: 'y7wdat051ol0',
    accessToken: 'wuLKc8OEuVm1VJe70nrzIAaNu71Bg9UV9XRQMkqkV_o',
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('Fetching data...'); 

        const warehouseResponse = await client.getEntries({
          content_type: 'warehouseModel',
        });

        if (warehouseResponse.errors) {
          console.error('Error fetching warehouse data:', warehouseResponse.errors);
          throw new Error('Error fetching warehouse data');
        }

        const warehouseNames = warehouseResponse.items.map(item => item.fields.name);
        setWarehouses(warehouseNames);

        const shippingResponse = await client.getEntries({
          content_type: 'shippingRouteModel',
        });

        if (shippingResponse.errors) {
          console.error('Error fetching shipping router data:', shippingResponse.errors);
          throw new Error('Error fetching shipping router data');
        }

        const destinationCities = [...new Set(shippingResponse.items.map(item => item.fields.destination))];
        setDestinations(destinationCities);

      } catch (err) {
        console.error('Error during data fetching:', err);
        setError('There was an error fetching data. Please try again.');
      }
    };

    fetchData();
  }, []);

  // Handle form submission
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setShippingOptions(null);
    setError('');

    if (origin === destination) {
      setError('Origin and destination cannot be the same.');
      return;
    }

    try {
      const response = await fetch(`http://localhost:3000/shipping?origin=${origin}&destination=${destination}`);
      const data = await response.json();

      if (response.ok) {
        if (data && data.cheapest && data.fastest && data.best) {
          setShippingOptions(data);
        } else {
          setError('No shipping options available.');
        }
      } else {
        setError(data.error || 'An error occurred while fetching shipping options.');
      }
    } catch (err) {
      console.error(err);
      setError('Error connecting to the server.');
    }
  };

  return (
    <div className="app-container">
      <h1>Shipping Calculator</h1>
      <form onSubmit={handleFormSubmit} className="form-container">
        <div className="form-group">
          <label>Origin City: </label>
          <select value={origin} onChange={(e) => setOrigin(e.target.value)} required>
            <option value="">Select Origin</option>
            {warehouses.length > 0 ? (
              warehouses.map((warehouse, index) => (
                <option key={index} value={warehouse}>
                  {warehouse}
                </option>
              ))
            ) : (
              <option disabled>No warehouses available</option>
            )}
          </select>
        </div>

        <div className="form-group">
          <label>Destination City: </label>
          <select value={destination} onChange={(e) => setDestination(e.target.value)} required>
            <option value="">Select Destination</option>
            {destinations.length > 0 ? (
              destinations.map((destinationCity, index) => (
                <option key={index} value={destinationCity}>
                  {destinationCity}
                </option>
              ))
            ) : (
              <option disabled>No destinations available</option>
            )}
          </select>
        </div>

        <button type="submit" className="submit-btn">Get Shipping Routes</button>
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

