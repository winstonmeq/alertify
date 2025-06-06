import Image from 'next/image';
// import { NavBar } from '@/components/NavBar';
// import { Features } from '@/components/Features';
// import { AppShowcase } from '@/components/AppShowcase';
// import { Pricing } from '@/components/Pricing';
// import { Contact } from '@/components/Contact';
// import { Footer } from '@/components/Footer';

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      {/* <NavBar /> */}

      {/* Header */}
      <header id="home" className="bg-gradient-to-r from-blue-500 to-purple-600 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Mobile App Landing Page Template
            </h1>
            <p className="text-lg md:text-xl max-w-2xl mx-auto">
              The one and only solution for any kind of mobile app landing needs. Just change the screenshots and texts and you are good to go.
            </p>
          </div>
          <div className="mt-8 flex justify-center">
            <Image
              src="/images/iphonex.png"
              alt="phone"
              width={300}
              height={600}
              className="object-contain"
            />
          </div>
        </div>
      </header>

      {/* Client Logos */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="flex justify-center">
            <Image
              src="/images/client-logos.png"
              alt="client logos"
              width={600}
              height={100}
              className="object-contain"
            />
          </div>
        </div>
      </section>

   
    </div>
  );
}