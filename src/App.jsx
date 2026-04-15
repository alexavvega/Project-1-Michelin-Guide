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
  const [threeStarCount, setThreeStarCount] = useState(0);
  const [filterStar, setFilterStar] = useState('All');
  const [countryTopStarTotals, setCountryTopStarTotals] = useState([]);

  const getStarsFromAward = (value) => {
    const match = String(value).match(/\d+/);
    return match ? parseInt(match[0], 10) : 0;
  };

  const getCountryFromLocation = (location) => {
    const parts = String(location || '').split(',');
    return parts.length > 1 ? parts[parts.length - 1].trim() : String(location || '').trim();
  };

  const getFlagEmoji = (country) => {
    const flags = {
      France: '🇫🇷',
      Germany: '🇩🇪',
      Japan: '🇯🇵',
      USA: '🇺🇸',
      'United States': '🇺🇸',
      Italy: '🇮🇹',
      Spain: '🇪🇸',
      'United Kingdom': '🇬🇧',
      'China Mainland': '🇨🇳',
      China: '🇨🇳',
      Singapore: '🇸🇬',
      Taiwan: '🇹🇼',
    };

    return flags[country] || '🌍';
  };

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

            const awardKey = Object.keys(sample).find(k => k.toLowerCase().includes('award'));
            if (awardKey) {
              const count3 = cleanData.filter(item => getStarsFromAward(item[awardKey]) === 3).length;
              setThreeStarCount(count3);

              const countryTotals = cleanData.reduce((acc, item) => {
                const country = getCountryFromLocation(item[lKey]);
                if (!country) return acc;
                const stars = getStarsFromAward(item[awardKey]);
                if (!stars) return acc;
                acc[country] = (acc[country] || 0) + stars;
                return acc;
              }, {});

              const top10 = Object.entries(countryTotals)
                .map(([country, totalStars]) => ({ country, totalStars }))
                .sort((a, b) => b.totalStars - a.totalStars)
                .slice(0, 10);

              setCountryTopStarTotals(top10);
            }
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
    const awardKey = Object.keys(sample).find(k => k.toLowerCase().includes('award'));
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
    if (filterStar !== 'All' && awardKey) {
      result = result.filter(item => getStarsFromAward(item[awardKey]) === Number(filterStar));
    }
    setFilteredData(result);
  }, [selectedLocation, selectedCuisine, filterStar, data]);

  const maxCountryStars = countryTopStarTotals[0]?.totalStars || 1;

  return (
  <div className="app-container">
    <header className="app-header">
  <div className="header-inner">
    
    <div className="header-left">
      <h2>Michelin Explorer</h2>
    </div>

    <div className="header-controls">
      <select
        value={selectedLocation}
        onChange={(e) => setSelectedLocation(e.target.value)}
      >
        <option value="All">All Locations</option>
        {locationList.map((loc) => (
          <option key={loc} value={loc}>
            {loc}
          </option>
        ))}
      </select>

      <select
        value={selectedCuisine}
        onChange={(e) => setSelectedCuisine(e.target.value)}
      >
        <option value="All">All Cuisines</option>
        {cuisineList.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>

      <div className="star-buttons">
        {['3', '2', '1'].map((stars) => (
          <button
            key={stars}
            type="button"
            className={filterStar === stars ? 'active' : ''}
            onClick={() => setFilterStar(prev => prev === stars ? 'All' : stars)}
          >
            {'★'.repeat(Number(stars))}
          </button>
        ))}
      </div>

    </div>

  </div>
</header>

<section className="stats-panel">
  <div className="stats-stack">
    <div className="stat-card">
      <span className="stat-label">Total</span>
      <strong className="stat-value">{data.length.toLocaleString()}</strong>
      <span className="stat-subtext">restaurants</span>
    </div>

    <div className="stat-card">
      <span className="stat-label">Locations</span>
      <strong className="stat-value">{locationList.length}</strong>
      <span className="stat-subtext">available filters</span>
    </div>

    <div className="stat-card">
      <span className="stat-label">3-Star</span>
      <strong className="stat-value">{threeStarCount}</strong>
      <span className="stat-subtext">worldwide</span>
    </div>
  </div>

  <div className="country-stars-card">
    <div className="country-stars-header">
      <span className="stat-label">STARS BY COUNTRY</span>
      <span className="stat-subtext">Top 10 countries</span>
    </div>

    <div className="country-stars-list">
      {countryTopStarTotals.length > 0 ? (
        countryTopStarTotals.map((item, index) => (
          <div key={item.country} className="country-star-row">
            <div className="country-star-row-label">
              <span>  {getFlagEmoji(item.country)} {index + 1}. {item.country}</span>
              <span>{item.totalStars}</span>
            </div>

            <div className="country-star-bar">
              <div
                className="country-star-bar-fill"
                style={{
                  width: `${Math.round((item.totalStars / maxCountryStars) * 100)}%`,
                }}
              />
            </div>
          </div>
        ))
      ) : (
        <div className="country-star-empty">Calculating country totals...</div>
      )}
    </div>
  </div>
</section>

<main className="map-container">
  {data.length > 0 ? (
    <MapDisplay restaurants={filteredData} center={mapCenter} />
  ) : (
    <div className="loading">
      Loading data... (Please check your CSV file)
    </div>
  )}
</main>
</div>
);
}

export default App;