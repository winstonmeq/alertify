import PolygonForm from '../polygonForm';

export default function NewPolygon() {
  return (
    <div>
      <h2 className="text-xl bg-gray-200 p-10 font-semibold">Create New Location</h2>
      <div className='p-12'><PolygonForm /></div>
    </div>
  );
}