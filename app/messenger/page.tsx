



'use client'
import { useEffect, useState } from 'react';
import { JSX } from 'react/jsx-runtime';

interface Messenger {
  _id: string
  emergency_m: string
  name_m: string
  mobile_m: string
  purok_m: string
  barangay_m: string
  position_m: string
  lat_m: string
  long_m:string
}


export default function Home(): JSX.Element {

  const [data, setPatients] = useState<Messenger[]>([]);

  useEffect(() => {
    const eventSource = new EventSource("/api/stream");
   
    eventSource.onmessage = (event) => {
      try {
        const newPatient = JSON.parse(event.data);
    
        setPatients((prev) => [newPatient, ...prev]);

        console.log(newPatient)
      } catch (error) {
        console.error("Error parsing stream data:", error);
      }
    };


    return () => eventSource.close();
  }, []);

 
  console.log(data);
  return (
    <div>
            <h1>Real-Time Dashboard</h1>
<div>
{data.map((item,index) => (
          <ul key={index}>
            <li>Emergercy: {item.emergency_m}</li>
            <li>Name: {item.name_m}</li> 
          </ul>
        ))}
</div>
        
      
    </div>
  );
}