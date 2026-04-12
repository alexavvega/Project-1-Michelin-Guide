import { MapContainer, TileLayer, Marker, Popup, Tooltip, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import { useEffect } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// 1. 등급별 커스텀 마커 생성 함수 (isGreen 반영 확인!)
const createCustomIcon = (stars, isGreen) => {
    let color = "#3498db"; // 기본: Selected (Blue)
    let scale = 1;

    // ☘️ 그린스타가 있으면 무조건 초록색으로 표시
    if (isGreen) {
        color = "#2E7D32"; // Michelin Green
        scale = 1.1;
    } else {
        // 그린스타가 없을 때만 별점 색상 적용
        if (stars.includes("⭐⭐⭐")) {
            color = "#E60000"; 
            scale = 1.35;
        } else if (stars.includes("⭐⭐")) {
            color = "#FF5722"; 
            scale = 1.2;
        } else if (stars.includes("⭐")) {
            color = "#FFC107"; 
            scale = 1.1;
        } else if (stars.includes("Bib")) {
            color = "#9C27B0"; 
        }
    }

    return L.divIcon({
        className: 'custom-michelin-pin',
        html: `
            <div style="
                background-color: ${color};
                width: ${18 * scale}px;
                height: ${18 * scale}px;
                border-radius: 50% 50% 50% 0;
                transform: rotate(-45deg);
                border: 2px solid white;
                box-shadow: 0 2px 5px rgba(0,0,0,0.4);
            "></div>`,
        iconSize: [25, 25],
        iconAnchor: [12, 25]
    });
};

function ChangeView({ center }) {
    const map = useMap();
    useEffect(() => {
        if (center && !isNaN(center[0]) && !isNaN(center[1])) {
            map.setView(center, 13);
        }
    }, [center, map]);
    return null;
}

function MapDisplay({ restaurants, center }) {
    // [보정 로직들]
    const getStarDisplay = (item) => {
        const awardKey = Object.keys(item).find(k => k.trim().toLowerCase().includes('award') || k.trim().toLowerCase().includes('star'));
        const rawValue = item[awardKey] ? String(item[awardKey]).toLowerCase() : "";
        if (rawValue.includes("3")) return "⭐⭐⭐";
        if (rawValue.includes("2")) return "⭐⭐";
        if (rawValue.includes("1")) return "⭐";
        if (rawValue.includes("bib")) return "😋 Bib Gourmand";
        return "MICHELIN Selected";
    };

    const hasGreenStar = (item) => {
        const greenKey = Object.keys(item).find(k => k.trim().toLowerCase().includes('green'));
        // 데이터 값이 "1", 1, 혹은 "yes" 등인 경우 확인
        const val = item[greenKey];
        return val === "1" || val === 1 || String(val).toLowerCase() === 'yes';
    };

    const formatPriceToDollar = (priceText) => {
        if (!priceText) return "";
        const cleanPrice = String(priceText).replace(/#/g, '').trim();
        return "$".repeat(cleanPrice.length || 1);
    };

    const extractCoords = (val) => {
        if (!val) return NaN;
        const cleaned = String(val).replace(/[^0-9.-]/g, '');
        const num = parseFloat(cleaned);
        return isNaN(num) ? NaN : num;
    };

    const formatPhoneNumber = (phone) => {
        if (!phone || String(phone).trim() === "" || String(phone).includes('null')) return "No phone number";
        const num = Number(phone);
        if (isNaN(num)) return String(phone);
        const rawStr = num.toLocaleString('en-US', { useGrouping: false }).split('.')[0];
        if (rawStr.startsWith('886') && rawStr.length >= 11) {
            return `+886 ${rawStr.slice(3, 4)}-${rawStr.slice(4, 8)}-${rawStr.slice(8)}`;
        }
        if (rawStr.length > 9) {
            const tail = rawStr.slice(-4), mid = rawStr.slice(-8, -4), head = rawStr.slice(0, -8);
            return `+${head}-${mid}-${tail}`;
        }
        return rawStr;
    };

    return (
        <div style={{ height: '100%', width: '100%' }}>
            <style>
                {`
                .marker-cluster div {
                    font-size: 14px !important;
                    font-weight: 900 !important;
                    color: #fff !important;
                }
                .marker-cluster {
                    background-color: rgba(230, 0, 0, 0.4) !important;
                }
                .marker-cluster-small div, .marker-cluster-medium div, .marker-cluster-large div {
                    background-color: rgba(230, 0, 0, 0.8) !important;
                    border-radius: 50%;
                }
                `}
            </style>

            <MapContainer center={center} zoom={12} style={{ height: '100%', width: '100%' }}>
                <ChangeView center={center} />
                <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
                
                <MarkerClusterGroup chunkedLoading maxClusterRadius={60}>
                    {restaurants.map((res, idx) => {
                        const keys = Object.keys(res);
                        const findKey = (word) => keys.find(k => k.toLowerCase().includes(word.toLowerCase()));

                        const lat = extractCoords(res[findKey('latitude')]);
                        const lng = extractCoords(res[findKey('longitude')]);
                        const priceKey = findKey('price');
                        const descKey = findKey('description');
                        const phoneKey = findKey('phone');

                        if (!isNaN(lat) && !isNaN(lng)) {
                            const isGreen = hasGreenStar(res);
                            const stars = getStarDisplay(res);
                            const unifiedPrice = formatPriceToDollar(res[priceKey]);
                            const formattedPhone = formatPhoneNumber(res[phoneKey]);

                            return (
                                <Marker 
                                    key={`marker-${idx}`} 
                                    position={[lat, lng]} 
                                    icon={createCustomIcon(stars, isGreen)} // <-- 이 부분에서 isGreen을 다시 확실히 전달!
                                >
                                    <Tooltip direction="top" offset={[0, -20]} opacity={0.9}>
                                        <div style={{ padding: '4px 8px', textAlign: 'center' }}>
                                            <div style={{ fontSize: '13px', fontWeight: '700' }}>
                                                {res.Name || res.name} {isGreen && "☘️"}
                                            </div>
                                            <div style={{ color: '#E60000', fontSize: '11px', fontWeight: 'bold' }}>
                                                {stars}
                                            </div>
                                        </div>
                                    </Tooltip>

                                    <Popup minWidth={280}>
                                        <div style={{ fontFamily: "'Segoe UI', Roboto, sans-serif", color: '#2c3e50', padding: '5px' }}>
                                            <div style={{ marginBottom: '12px' }}>
                                                <h3 style={{ margin: '0 0 6px 0', fontSize: '18px', fontWeight: '700' }}>
                                                    {res.Name || res.name} {isGreen && "☘️"}
                                                </h3>
                                                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                                    <span style={{ color: '#E60000', fontWeight: '800', fontSize: '14px' }}>{stars}</span>
                                                    {isGreen && <span style={{ fontSize: '10px', backgroundColor: '#e8f5e9', color: '#2e7d32', padding: '2px 8px', borderRadius: '12px', fontWeight: 'bold' }}>GREEN STAR</span>}
                                                </div>
                                            </div>

                                            <div style={{ fontSize: '13px', lineHeight: '1.6', color: '#555', backgroundColor: '#f8f9fa', padding: '12px', borderRadius: '8px', marginBottom: '15px', borderLeft: '4px solid #E60000', maxHeight: '110px', overflowY: 'auto' }}>
                                                {res[descKey] || "No description available."}
                                            </div>

                                            <div style={{ display: 'grid', gap: '10px', fontSize: '13px' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <span style={{ color: '#888' }}>🍴 Cuisine</span>
                                                    <span style={{ fontWeight: '600', backgroundColor: '#eee', padding: '1px 8px', borderRadius: '10px', fontSize: '11px' }}>{res.Cuisine}</span>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <span style={{ color: '#888' }}>💰 Price</span>
                                                    <span style={{ fontWeight: '600', color: '#2ecc71' }}>{unifiedPrice}</span>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <span style={{ color: '#888' }}>📞 Contact</span>
                                                    <a href={`tel:${formattedPhone}`} style={{ color: '#007bff', textDecoration: 'none', fontWeight: '600' }}>{formattedPhone}</a>
                                                </div>
                                            </div>

                                            <div style={{ marginTop: '15px', paddingTop: '10px', borderTop: '1px solid #eee', fontSize: '10px', color: '#95a5a6', textAlign: 'right' }}>
                                                Latitude: {lat.toFixed(6)} / Longitude: {lng.toFixed(6)}
                                            </div>
                                        </div>
                                    </Popup>
                                </Marker>
                            );
                        }
                        return null;
                    })}
                </MarkerClusterGroup>
            </MapContainer>
        </div>
    );
}

export default MapDisplay;