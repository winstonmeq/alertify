
'use client'
import { useEffect, useState } from 'react';
import { JSX } from 'react/jsx-runtime';

interface Emergency {
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

  const [emergency, setEmergency] = useState<Emergency[]>([]);

  

  

  
  useEffect(() => {

    const eventSource = new EventSource("/api/stream");

    console.log(eventSource)
   
    eventSource.onmessage = async (event) => {
      try {

        console.log(event)
       
        const response = await fetch("/api/emergency");

        if (!response.ok) throw new Error("Failed to fetch patient data");

        const responseData = await response.json();

        setEmergency(responseData.emergency_data);
  
        console.log(responseData);

      } catch (error) {

        console.error("Error parsing stream data:", error);
      }
    };


    return () => eventSource.close();
  }, []);






 
  return (
    <div>
            <h1>Real-Time Dashboard</h1>
<div>
{emergency.map((item,index) => (
          <ul key={index}>
            <li>Emergercy: {item.emergency}</li>
            <li>Name: {item.name}</li> 
          </ul>
        ))}
</div>
        
      
    </div>
  );
}


