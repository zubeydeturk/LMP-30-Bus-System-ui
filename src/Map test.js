import React, { useState } from "react";
import * as XLSX from "xlsx";

function Map() {
  const [file, setFile] = useState(null);
  const [jsonData, setJsonData] = useState("");

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

        setJsonData(JSON.stringify({ data: formattedData }, null, 2));
      };
      reader.readAsBinaryString(file);
    }
  };

  


  return (
    <div>
      <input
        type="file"
        accept=".xls,.xlsx"
        onChange={(e) => setFile(e.target.files[0])}
      />
      <button onClick={handleConvert}>Convert</button>
      <pre>{jsonData}</pre>
    </div>
  );
}

export default Map;