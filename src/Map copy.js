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
    const [genData, setGenData] = useState([]);
    const [hour, setHour] = useState(0);
    const [busColor, setBusColor] = useState([])

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


        const getColor = (data) => {
            console.log(data.LMP[0])
            let color = ""
            switch (true) {
                case data.LMP[hour] <= -0.5:
                    color= "blue"
                    return color
                case data.LMP[hour] <= -0.2:
                    color= "rgb(0, 174, 255)"
                    return color
                case data.LMP[hour] <= 0:
                    color= "cyan"
                    return color
                case data.LMP[hour] <= 0.2:
                    color= "yellow"
                    return color
                case data.LMP[hour] < 0.5:
                    color= "orange"
                    return color
                case data.LMP[hour] >= 0.5:
                    color= "red"
                    return color
                
            }
            
        }

    const [file, setFile] = useState(null);
    const [jsonData, setJsonData] = useState(substationData);

    const handleConvert = () => {
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const data = e.target.result;
                const workbook = XLSX.read(data, { type: "binary" });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const rows = XLSX.utils.sheet_to_json(worksheet);
    
                // JSON verisini istenilen formata dönüştürme
                const formattedData = rows.map((row) => {
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
    
                // Make sure to store the array, not the stringified data
                setJsonData(formattedData);
            };
            reader.readAsBinaryString(file);
        }
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
                <div style={{ textAlign: "right" , marginTop:"20px" }}>

                <Select  options={hourOptions} defaultValue={hour} onChange={(e)=> setHour(e)} style={{zIndex:1000, width:"100px" , height:"30px"}}></Select>
                <input
                    type="file"
                    accept=".xls,.xlsx"
                    onChange={(e) => setFile(e.target.files[0])}
                    style={{marginLeft:"20px" }}
                />
                
                <button className="convert-button" style={{marginLeft:"-50px" , marginRight:"50px"}} onClick={handleConvert}>Convert</button>
                
                    
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
