require('dotenv').config();
const express = require('express');
const cors = require('cors');
const contentful = require('contentful');

const app = express();
app.use(cors());
app.use(express.json());

const client = contentful.createClient({
  space: process.env.CONTENTFUL_SPACE_ID,
  accessToken: process.env.CONTENTFUL_ACCESS_TOKEN,
});

async function getWarehouseEntryIdByName(warehouseName) {
  const response = await client.getEntries({
    content_type: 'warehouseModel',
    'fields.name': warehouseName,
  });

  if (response.items.length > 0) {
    return response.items[0].sys.id;
  } else {
    throw new Error(`Warehouse with name "${warehouseName}" not found.`);
  }
}

async function getShippingRates(originCityId, destination) {
  const response = await client.getEntries({
    content_type: 'shippingRouteModel',
    'fields.originCity.sys.id': originCityId,
    'fields.destination': destination,
  });

  return response.items.map(item => ({
    source: item.fields.originCity?.fields?.name || 'Unknown',
    sourceCity: item.fields.originCity?.fields?.city || 'Unknown City',
    destination: item.fields.destination,
    transport_mode: item.fields.transportMode || 'Unknown Mode',
    cost: item.fields.cost,
    time_hours: item.fields.timeHours,
  }));
}

function findBestShippingOptions(shippingData) {
  if (shippingData.length === 0) return { message: 'No shipping options available' };

  let cheapest = shippingData.reduce((a, b) => (a.cost < b.cost ? a : b));
  let fastest = shippingData.reduce((a, b) => (a.time_hours < b.time_hours ? a : b));
  let best = shippingData.find(entry =>
    entry.cost <= cheapest.cost * 1.2 && entry.time_hours <= fastest.time_hours * 1.2
  ) || cheapest;

  return { best, cheapest, fastest };
}

app.get('/shipping', async (req, res) => {
  const { origin, destination } = req.query;
  if (!origin || !destination) return res.status(400).json({ error: 'Origin and destination are required' });

  try {
    const originCityId = await getWarehouseEntryIdByName(origin);
    const rates = await getShippingRates(originCityId, destination);
    const options = findBestShippingOptions(rates);
    res.json(options);
  } catch (error) {
    console.error('Error fetching data from Contentful:', error);
    res.status(500).json({ error: 'Error fetching data from Contentful', details: error.message });
  }
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
