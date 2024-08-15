import { Marker, MapContainer, TileLayer, Tooltip, Polygon, Circle, Polyline, useMapEvents, useMap, Popup, CircleMarker, MapConsumer, Rectangle } from "react-leaflet";
import * as GeometryUtil from "leaflet-geometryutil";
import 'leaflet/dist/leaflet.css';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import * as L from "leaflet";
import React, { useEffect, useState, useRef } from "react";
import "./index.css";
import { Button, Select, DatePicker, Tag } from "antd";
import "leaflet-polylinedecorator"
import * as XLSX from "xlsx";


const Map = () => {
    const [substationData, setSubstationData] = useState([]);
    const [lineData, setLineData] = useState([]);
    const [loadData, setLoadData] = useState([]);
    const [newLoadData, setNewLoadData] = useState([]);
    const [genData, setGenData] = useState([]);
    const [hour, setHour] = useState(0);
    const [busColor, setBusColor] = useState([])
    const [rangeData, setRangeData] = useState([])
    const[showRangeBar, setShowRangeBar] = useState(0)

    let hourOptions = [];
    for (let i = 0; i < 24; i++) {
        hourOptions.push({ value: i, label: i });
    }

    
    useEffect(() => {
        let data1 = structuredClone(require("./substationData.json"));
        let data2 = structuredClone(require("./lineData.json"));
        let data3 = structuredClone(require("./loadData.json"));
        let data4 = structuredClone(require("./genData.json"));
        setSubstationData(data1.data);
        setLineData(data2.data);
        setLoadData(data3.data);
        setGenData(data4.data);
    }, []);

    const ArrowIcon = new L.Icon({
        iconUrl: '/arrow-213-32.png', 
        iconSize: [10, 10], 
    });


    const CustomRectangle = ({ bounds, color }) => {
        return (
            <Rectangle
                bounds={bounds}
                pathOptions={{ color: color, weight: 7 }} // Custom styling
            >
                <Popup>
                    <div>Rectangle bounds: {bounds[0].lat}, {bounds[0].lng} to {bounds[1].lat}, {bounds[1].lng}</div>
                </Popup>
            </Rectangle>
        );
    };



    const [file, setFile] = useState(null);
    const [jsonData, setJsonData] = useState(substationData);

    const handleConvert = () => {
        if (file) {
            setShowRangeBar(1);
            const reader = new FileReader();
            reader.onload = (e) => {
                const data = e.target.result;
                const workbook = XLSX.read(data, { type: "binary" });
        
                // Tüm sheet'leri işle
                workbook.SheetNames.forEach((sheetName, index) => {
                    const worksheet = workbook.Sheets[sheetName];
                    const rows = XLSX.utils.sheet_to_json(worksheet);
        
                    if (index === 0) {
                        // İlk sheet için işlemler
                        const allLMPValues = [];
                        const formattedData = rows.map((row) => {
                            const LMPValues = Array.from({ length: 24 }, (_, i) => row[`LMP_${i}`]);
                            allLMPValues.push(...LMPValues);
                            return {
                                ID: row.ID.toString(),
                                markerCoordinate: [row.markerCoordinate_lat, row.markerCoordinate_lng],
                                coordinate: [
                                    [row.coordinate_lat1, row.coordinate_lng1],
                                    [row.coordinate_lat2, row.coordinate_lng2],
                                ],
                                LMP: Array.from({ length: 24 }, (_, i) => row[`LMP_${i}`]),
                            };
                        });

                        setJsonData(formattedData);
                        allLMPValues.sort((a, b) => a - b);
                        const min = parseFloat(Math.min(...allLMPValues).toFixed(2));
                        const max = parseFloat(Math.max(...allLMPValues).toFixed(2));
                        const q1 = parseFloat(allLMPValues[Math.floor(allLMPValues.length * 0.25)].toFixed(2));
                        const median = parseFloat(allLMPValues[Math.floor(allLMPValues.length * 0.5)].toFixed(2));
                        const q3 = parseFloat(allLMPValues[Math.floor(allLMPValues.length * 0.75)].toFixed(2));

                        setRangeData([min,q1,median,q3,max])
        
    
                        console.log(`First Sheet Name: ${sheetName}`);
                        console.log('Formatted Data:', formattedData);
                    } else if (index === 1) {

                        const allLMPValues = [];
                        const formattedData = rows.map((row) => {
                            
                            return {
                                ID: row.ID.toString(),
                                markerCoordinate: [row.markerCoordinate_lat, row.markerCoordinate_lng],
                                Load: Array.from({ length: 24 }, (_, i) => row[`Load_${i}`]),
                            };
                        });

                        setNewLoadData(formattedData);
                        
                        const firstColumn = rows.map(row => row[Object.keys(row)[0]]);
                        console.log(firstColumn)
                        console.log(`Second Sheet Name: ${sheetName}`);
                        console.log('First Column Data:', formattedData);
                    } else {
                        console.log(`Other Sheet Name: ${sheetName}`);
                        console.log('Sheet Data:', rows);
                    }
                });

                
            };
            reader.readAsBinaryString(file)
        }
    };

    const getColor = (data) => {
        if (rangeData.length === 0) return ""; 
        
        const LMPValue = data.LMP[hour];
        let color = "";
    
        switch (true) {
            case LMPValue <= rangeData[0]: // min
                color = "#E40B0B";
                break;
            case LMPValue <= rangeData[1]: // q1
                color = "#F35E0E";
                break;
            case LMPValue <= rangeData[2]: // median
                color = "#F5EA14";
                break;
            case LMPValue <= rangeData[3]: // q3
                color = "#74E22A";
                break;
            case LMPValue <= rangeData[4]: // max
                color = "#0DBB33";
                break;
            default:
                color = "#0B5B1C"; // Üst sınır için
                break;
        }
    
        return color;
    };

    console.log(substationData)

    return (
        <div style={{ height: "100vh", width: "100%" }}>
            <MapContainer
                className="map-container"
                center={[20, 34]}
                zoom={6}
                minZoom={6}
                doubleClickZoom={false}
                style={{ height: '100%', width: "100%", cursor: "pointer" }}
                dragging={true}
                zoomControl={true}
                //maxZoom={20}
                //minZoom={7}
                attributionControl={false}
            >
                <div style={{ textAlign: "right", marginTop: "20px" }}>
    <div
        style={{
            backgroundColor: "white",
            padding: "20px",
            borderRadius: "8px",
            marginLeft: "1300px",
            width: "470px",
            boxShadow: "0px 4px 6px rgba(0,0,0,0.1)",
        }}
    >
        <div style={{ display: "flex", alignItems: "center" }}>
            <Select
                options={hourOptions}
                defaultValue={hour}
                onChange={(e) => setHour(e)}
                style={{ zIndex: 1000, width: "100px", height: "30px" }}
            ></Select>
            <input
                type="file"
                accept=".xls,.xlsx"
                onChange={(e) => setFile(e.target.files[0])}
                style={{ marginLeft: "20px" }}
            />
            <button
                className="convert-button"
                style={{
                    marginLeft: "-40px",
                    backgroundColor: file ? "#00008b" : "#ccc",
                }}
                onClick={handleConvert}
            >
                Convert
            </button>
        </div>

        {showRangeBar === 1 && 

        <div style={{ marginTop: "20px" }}>
            <div style={{ marginBottom: "10px" }}>
                <div style={{ display: "flex", alignItems: "center" }}>
                    <div
                        style={{
                            width: "20px",
                            height: "20px",
                            backgroundColor: "#E40B0B",
                            marginRight: "10px",
                        }}
                    ></div>
                    <span>{`<= ${rangeData[0]}`}</span>
                </div>
            </div>
            <div style={{ marginBottom: "10px" }}>
                <div style={{ display: "flex", alignItems: "center" }}>
                    <div
                        style={{
                            width: "20px",
                            height: "20px",
                            backgroundColor: "#F35E0E",
                            marginRight: "10px",
                        }}
                    ></div>
                    <span>{`${rangeData[0]} - ${rangeData[1]}`}</span>
                </div>
            </div>
            <div style={{ marginBottom: "10px" }}>
                <div style={{ display: "flex", alignItems: "center" }}>
                    <div
                        style={{
                            width: "20px",
                            height: "20px",
                            backgroundColor: "#F5EA14",
                            marginRight: "10px",
                        }}
                    ></div>
                    <span>{`${rangeData[1]} -  ${rangeData[2]}`}</span>
                </div>
            </div>
            <div style={{ marginBottom: "10px" }}>
                <div style={{ display: "flex", alignItems: "center" }}>
                    <div
                        style={{
                            width: "20px",
                            height: "20px",
                            backgroundColor: "#74E22A",
                            marginRight: "10px",
                        }}
                    ></div>
                    <span>{`${rangeData[2]} - ${rangeData[3]}`}</span>
                </div>
            </div>
            <div style={{ marginBottom: "10px" }}>
                <div style={{ display: "flex", alignItems: "center" }}>
                    <div
                        style={{
                            width: "20px",
                            height: "20px",
                            backgroundColor: "#0DBB33",
                            marginRight: "10px",
                        }}
                    ></div>
                    <span>{`${rangeData[3]} - ${rangeData[4]}`}</span>
                </div>
            </div>
            <div style={{ marginBottom: "10px" }}>
                <div style={{ display: "flex", alignItems: "center" }}>
                    <div
                        style={{
                            width: "20px",
                            height: "20px",
                            backgroundColor: "#0B5B1C",
                            marginRight: "10px",
                        }}
                    ></div>
                    <span>{`>= ${rangeData[4]}`}</span>
                </div>
            </div>
        </div>
}
    </div>
</div>
                    

                {substationData.map((data) => {
                    return (
                        <div key={data.ID}>
                            <CustomRectangle bounds={data.coordinate} color="black" />
                            <Marker position={data.markerCoordinate} opacity={0}>
                                <Tooltip direction="right" offset={[-20, 30]} opacity={1} permanent className="custom-tooltip">
                                    {data.ID}
                                </Tooltip>
                            </Marker>
                        </div>
                    );
                })}
                {jsonData.map((data) => {
                    let color = getColor(data)
                    return (
                        <div key={data.ID}>
                            <CustomRectangle bounds={data.coordinate} color={color} />
                            <Marker position={data.markerCoordinate} opacity={0}>
                                <Tooltip direction="right" offset={[-20, 30]} opacity={1} permanent className="custom-tooltip">
                                    {data.ID}
                                </Tooltip>
                            </Marker>
                        </div>
                    );
                })}

                
                
                
                {genData.map((data) => {
                    return (
                        <div key={data.ID}>
                            <CircleMarker center={data.coordinate[1]} radius={10} pathOptions={{ color: "black", fillColor: "black", fillOpacity: 1 }} >
                                <Marker position={data.coordinate[1]} opacity={0}>
                                    <Tooltip direction="right" offset={[-27.5, 29]} opacity={1} permanent className="custom-tooltip2">
                                        G
                                    </Tooltip>
                                </Marker>
                            </CircleMarker>
                            <Polyline key={data.ID} positions={data.coordinate} color="black" />
                        </div>
                    );
                })}
                {lineData.map((data) => {
                    return (
                        <div key={data.ID}>
                            <Polyline key={data.ID} positions={data.coordinate} color="black" />
                        </div>
                    );
                })}
                {loadData.map((data) => {
                    const lastPoint = data.coordinate[data.coordinate.length - 1]; // Polyline'ın son noktası
                    return (
                        <div key={data.ID}>
                            <Polyline positions={data.coordinate} color="black" />
                            <Marker position={lastPoint} icon={ArrowIcon} />
                        </div>
                    );
                })}
            </MapContainer>
        </div>
    );
};

export default Map;
