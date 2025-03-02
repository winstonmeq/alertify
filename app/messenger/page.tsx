



'use client'
import { useEffect, useState } from 'react';
import { JSX } from 'react/jsx-runtime';

interface Messenger {
  _id: string
  emergency: string
  name: string
  mobile: string
  purok: string
  barangay: string
  position: string
  lat: string
  long:string
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
            <li>Emergercy: {item.emergency}</li>
            <li>Name: {item.name}</li> 
          </ul>
        ))}
</div>
        
      
    </div>
  );
}