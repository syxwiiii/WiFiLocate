import { useState, useEffect } from 'react'
import { YMaps, Map, Placemark } from '@pbe/react-yandex-maps'
import './App.css'

export default function App() {
  const [isDarkTheme, setIsDarkTheme] = useState(true)
  const [pointType, setPointType] = useState('wifi') // 'wifi' or 'toilet'
  const [points, setPoints] = useState([])
  const [newPoint, setNewPoint] = useState({
    name: '',
    password: '',
    coordinates: null,
    type: 'wifi',
    label: 'WiFi'
  })
  const [userLocation] = useState([54.71, 20.52])
  const [selectedPoint, setSelectedPoint] = useState(null)
  const [nearestPoints, setNearestPoints] = useState([])

  const findNearestPoints = () => {
    const filteredPoints = points.filter(p => p.type === pointType).map(point => ({
      ...point,
      distance: Math.sqrt(
        Math.pow(point.coordinates[0] - userLocation[0], 2) +
        Math.pow(point.coordinates[1] - userLocation[1], 2)
      )
    }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 3)

    setNearestPoints(filteredPoints)
  }

  const goToMyLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newLocation = [position.coords.latitude, position.coords.longitude]
          setUserLocation(newLocation)
          setShowUserLocation(true)
        },
        (error) => console.error(error)
      )
    }
  }

  useEffect(() => {

    // Load saved WiFi points
    const savedPoints = JSON.parse(localStorage.getItem('wifiPoints') || '[]')
    setPoints(savedPoints)
  }, [])

  const handleMapClick = (e) => {
    const coords = e.get('coords')
    setNewPoint(prev => ({ ...prev, coordinates: coords }))
  }

  const handleSavePoint = () => {
    if (!newPoint.coordinates) return
    if (pointType === 'wifi' && (!newPoint.name || !newPoint.password)) return
    
    const pointToSave = {
      ...newPoint,
      type: pointType,
      label: pointType === 'wifi' ? 'Точка доступа' : 'Туалет'
    }
    const newPoints = [...points, pointToSave]
    setPoints(newPoints)
    localStorage.setItem('wifiPoints', JSON.stringify(newPoints))
    setNewPoint({ name: '', password: '', coordinates: null })
  }

  const handleDeletePoint = () => {
    if (selectedPoint) {
      const newPoints = points.filter(point => 
        point.coordinates[0] !== selectedPoint.coordinates[0] || 
        point.coordinates[1] !== selectedPoint.coordinates[1]
      )
      setWifiPoints(newPoints)
      localStorage.setItem('wifiPoints', JSON.stringify(newPoints))
      setSelectedPoint(null)
    }
  }

  return (
    <main className={`container ${isDarkTheme ? 'dark' : 'light'}`}>
      <div className="form">
        <button onClick={() => setPointType(pointType === 'wifi' ? 'toilet' : 'wifi')}>
          {pointType === 'wifi' ? 'WiFi' : 'Туалеты'}
        </button>
        
        {pointType === 'wifi' && (
          <>
            <input
              type="text"
              placeholder="WiFi Name"
              value={newPoint.name}
              onChange={(e) => setNewPoint(prev => ({ ...prev, name: e.target.value }))}
            />
            <input
              type="text"
              placeholder="Password"
              value={newPoint.password}
              onChange={(e) => setNewPoint(prev => ({ ...prev, password: e.target.value }))}
            />
          </>
        )}
        
        <button onClick={handleSavePoint}>
          {pointType === 'wifi' ? 'Save WiFi Point' : 'Save Toilet'}
        </button>
        <button onClick={findNearestPoints}>Ближайшие точки</button>
          <p>Я нахожусь... прямо здесь! Куда смотрю? На ваш прекрасный код!</p>
      </div>

      <YMaps>
        <div className="map-container">
          <Map
            defaultState={{ center: userLocation, zoom: 15 }}
            width="100%"
            height="100%"
            onClick={handleMapClick}
            options={{
              theme: isDarkTheme ? 'dark' : 'light'
            }}
          >
          {points.filter(p => p.type === pointType).map((point, index) => (
            <Placemark
              key={index}
              geometry={point.coordinates}
              properties={{
                 balloonContent: pointType === 'wifi' 
                   ? `WiFi: ${point.name}<br/>Password: ${point.password}`
                   : 'Общественный туалет',
                 iconCaption: point.label
              }}
              options={{
                preset: 'islands#blueCircleDotIcon'
              }}
              onClick={() => {
                setSelectedPoint(point);
              }}
            />
          ))}
          {selectedPoint && (
            <Placemark
              geometry={selectedPoint.coordinates}
              properties={{
                balloonContent: `
                  <div style="padding: 10px">
                    <h3>WiFi: ${selectedPoint.name}</h3>
                    <p>Password: ${selectedPoint.password}</p>
                  </div>
                `
              }}
              options={{
                preset: 'islands#nightCircleDotIcon'
              }}
            />
          )}
          </Map>
        </div>
      </YMaps>

      {selectedPoint && (
        <div className="point-info-bottom">
          <button className="close-info-button" onClick={() => setSelectedPoint(null)}>✕</button>
          <h3>Информация о точке</h3>
          <input
            type="text"
            value={selectedPoint.label}
            onChange={(e) => {
              const newPoints = points.map(p => 
                p === selectedPoint ? {...p, label: e.target.value} : p
              );
              setPoints(newPoints);
              setSelectedPoint({...selectedPoint, label: e.target.value});
            }}
          />
          {selectedPoint.type === 'wifi' && (
            <>
              <p>WiFi: {selectedPoint.name}</p>
              <p>Пароль: {selectedPoint.password}</p>
            </>
          )}
          <button className="delete-button" onClick={handleDeletePoint}>Удалить точку WiFi</button>
        </div>
      )}

      {nearestPoints.length > 0 && (
        <div className="nearest-points">
          <div className="nearest-points-header">
            <h3>Ближайшие точки доступа:</h3>
            <button className="close-button" onClick={() => setNearestPoints([])}>✕</button>
          </div>
          {nearestPoints.map((point, index) => (
            <div key={index} className="point-info">
              <p>WiFi: {point.name}</p>
              <p>Password: {point.password}</p>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}