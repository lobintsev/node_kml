const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { parse } = require('fast-xml-parser');
const togeojson = require('@mapbox/togeojson');
const turf = require('@turf/turf');
const jsdom = require('jsdom'); // Import jsdom
const http = require('http');

const { JSDOM } = jsdom; // Destructure JSDOM from jsdom

const app = express();
app.use(cors());

app.get('/polygon', async (req, res) => {
  const { lat, lng, kmlUrl } = req.query;

  try {
    const response = await axios.get(kmlUrl);
    
    // Create a new instance of JSDOM and parse the string
    const dom = new JSDOM(response.data);
    const converted = togeojson.kml(dom.window.document);
    const point = turf.point([Number(lng), Number(lat)]);

    for (let feature of converted.features) {
      if (
        feature.geometry.type === "Polygon" &&
        turf.booleanPointInPolygon(point, feature)
      ) {
        return res.json({
          name: feature.properties.name,
          description: feature.properties.description,
        });
      }
    }
    res.json({ message: "Point not found in any polygon" });
  } catch (error) {
    res.status(500).json({ error: error.toString() });
  }
});

app.listen(process.env.PORT, () => {
  console.log('Server is running on port 4000');
});
