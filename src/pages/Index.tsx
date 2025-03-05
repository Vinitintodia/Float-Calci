
import React from 'react';
import NavBar from '@/components/NavBar';
import Hero from '@/components/Hero';
import Features from '@/components/Features';
import AppDemo from '@/components/AppDemo';
import Footer from '@/components/Footer';

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />
      <main className="flex-grow">
        <Hero />
        <Features />
        <AppDemo />
        
        {/* Call to Action Section */}
        <section id="about" className="py-24 bg-brand-blue relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-white blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full bg-white blur-3xl"></div>
          </div>
          
          <div className="container px-4 md:px-6 relative z-10">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                Ready to Transform Your Calculation Experience?
              </h2>
              <p className="text-xl text-white/80 mb-8">
                Download the beta version today and be among the first to experience the future of calculation.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button className="bg-white text-brand-blue hover:bg-white/90 font-medium px-8 py-3 rounded-full transition-all transform hover:scale-105">
                  Download for macOS
                </button>
                <button className="bg-transparent text-white border border-white/30 hover:bg-white/10 font-medium px-6 py-3 rounded-full transition-all">
                  Join Beta Program
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Index;
