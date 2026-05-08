import React, {useMemo} from 'react';
import {useMap} from 'react-leaflet';

const getDistance = (lat1,lon1,lat2,lon2) => {
    const R = 6371e3;
    const dLat = (lat2-lat1)*Math.PI/180;
    const dLon = (lon2-lon1)*Math.PI/180;
    const a = Math.sin(dLat/2)*Math.sin(dLat/2)+
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c=2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R*c;
};

const NearbyList = ({ restaurants, userLocation, markerRefs }) => {
    const map = useMap();

    // 1. 거리 계산 및 정렬 로직 (소문자 대응)
    const nearby = useMemo(() => {
        if (!userLocation || !restaurants.length) return [];

        return restaurants
            .map((res, idx) => {
                // 데이터 키값 유연하게 찾기 (대소문자 방어)
                const keys = Object.keys(res);
                const latKey = keys.find(k => k.toLowerCase() === 'latitude');
                const lngKey = keys.find(k => k.toLowerCase() === 'longitude');
                const nameKey = keys.find(k => k.toLowerCase() === 'name');
                const cuisineKey = keys.find(k => k.toLowerCase() === 'cuisine');

                const resLat = parseFloat(res[latKey]);
                const resLng = parseFloat(res[lngKey]);

                return {
                    ...res,
                    originalIndex: idx,
                    displayName: res[nameKey] || "Unknown",
                    displayCuisine: res[cuisineKey] || "Cuisine",
                    // 거리 계산
                    dist: (!isNaN(resLat) && !isNaN(resLng))
                        ? getDistance(userLocation.lat, userLocation.lng, resLat, resLng)
                        : Infinity
                };
            })
            .filter(res => res.dist !== Infinity)
            .sort((a, b) => a.dist - b.dist)
            .slice(0, 10); // 상위 10개만 표시
    }, [restaurants, userLocation]);

    if (!userLocation || nearby.length === 0) return null;

    const handleFlyTo = (res) => {
        map.flyTo([parseFloat(res.latitude), parseFloat(res.longitude)], 15, { duration: 1.5 });
        // 부모에서 넘겨받은 markerRefs를 통해 팝업 열기
        if (markerRefs.current[res.originalIndex]) {
            markerRefs.current[res.originalIndex].openPopup();
        }
    };

    return (
        <div className="nearby-list-container">
            <h3 style={{ color: '#E60000', margin: '0', padding: '20px 0 15px 0',fontSize: '14px', borderBottom: '2px solid #E60000', flexShrink: 0 }}>
                📍 NEARBY SELECTION
            </h3>
            <div className="nearby-scroll" style={{
                flex: 1,
                overflowY: 'auto',
                marginTop: '10px'
            }}>
                {nearby.map((res) => (
                    <div key={`nearby-${res.originalIndex}`} className="nearby-item" onClick={() => handleFlyTo(res)}>
                        <div className="name" style={{ fontWeight: 'bold', fontSize: '13px' }}>{res.displayName}</div>
                        <div className="info" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginTop: '4px' }}>
                            <span style={{ color: '#666' }}>{res.displayCuisine}</span>
                            <span style={{ color: '#E60000', fontWeight: 'bold' }}>
                                {res.dist > 1000 
                                    ? `${(res.dist / 1000).toFixed(1)}km` 
                                    : `${Math.round(res.dist)}m`}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default NearbyList;