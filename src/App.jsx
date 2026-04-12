import { useEffect, useState } from 'react'; 
import Papa from 'papaparse';
import './App.css';
import 'leaflet/dist/leaflet.css';
import MapDisplay from './components/MapDisplay';

function App() {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [cuisineList, setCuisineList] = useState([]);
  const [locationList, setLocationList] = useState([]);
  const [mapCenter, setMapCenter] = useState([25.0330, 121.5654]);
  const [selectedCuisine, setSelectedCuisine] = useState('All');
  const [selectedLocation, setSelectedLocation] = useState('All');

  useEffect(() => {
    fetch('/DATA_MICHELIN_RESTAURANTS.csv')
      .then(res => res.text())
      .then(csvText => {
        Papa.parse(csvText, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            const cleanData = results.data.map(row => {
              const newRow = {};
              Object.keys(row).forEach(key => { newRow[key.trim()] = row[key]; });
              return newRow;
            }).filter(item => item.Name || item.name);

            setData(cleanData);
            setFilteredData(cleanData);

            const sample = cleanData[0] || {};
            const cKey = Object.keys(sample).find(k => k.toLowerCase() === 'cuisine');
            const lKey = Object.keys(sample).find(k => k.toLowerCase() === 'location');

            if (cKey) setCuisineList([...new Set(cleanData.map(item => item[cKey]))].filter(Boolean).sort());
            if (lKey) setLocationList([...new Set(cleanData.map(item => item[lKey]))].filter(Boolean).sort());
          }
        });
      })
      .catch(err => console.error("Fetch Error:", err));
  }, []);

  useEffect(() => {
    let result = data;
    const sample = data[0] || {};
    const cKey = Object.keys(sample).find(k => k.toLowerCase() === 'cuisine');
    const lKey = Object.keys(sample).find(k => k.toLowerCase() === 'location');
    const latKey = Object.keys(sample).find(k => k.toLowerCase() === 'latitude');
    const lngKey = Object.keys(sample).find(k => k.toLowerCase() === 'longitude');

    if (selectedLocation !== 'All' && lKey) {
      result = result.filter(item => item[lKey] === selectedLocation);
      if (result.length > 0 && latKey && lngKey) {
        const lat = parseFloat(result[0][latKey]);
        const lng = parseFloat(result[0][lngKey]);
        if (!isNaN(lat) && !isNaN(lng)) setMapCenter([lat, lng]);
      }
    }
    if (selectedCuisine !== 'All' && cKey) {
      result = result.filter(item => item[cKey] === selectedCuisine);
    }
    setFilteredData(result);
  }, [selectedLocation, selectedCuisine, data]);

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header style={{ padding: '20px', borderBottom: '1px solid #ddd', background: 'white' }}>
        <h2>Michelin Explorer</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <select value={selectedLocation} onChange={(e) => setSelectedLocation(e.target.value)}>
            <option value="All">All Locations</option>
            {locationList.map(loc => <option key={loc} value={loc}>{loc}</option>)}
          </select>
          <select value={selectedCuisine} onChange={(e) => setSelectedCuisine(e.target.value)}>
            <option value="All">All Cuisines</option>
            {cuisineList.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <span>Found: <b>{filteredData.length}</b></span>
        </div>
      </header>
      <main style={{ flex: 1, position: 'relative' }}>
        {data.length > 0 ? (
          <MapDisplay restaurants={filteredData} center={mapCenter} />
        ) : (
<<<<<<< HEAD
          <div style={{ padding: '20px' }}>data loading... (Check your scv file)</div>
=======
          <div style={{ padding: '20px' }}>loading data... (please check the csv file)</div>
>>>>>>> 7e32962ba745db9570c449f1968eb57f99c7a1ed
        )}
      </main>
    </div>
  );
}

export default App;
