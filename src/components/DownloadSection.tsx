import React from 'react';
import { Button } from "@/components/ui/button";
import GlassCard from "@/components/ui-custom/GlassCard";
import AnimatedText from "@/components/ui-custom/AnimatedText";
import { Download, Laptop, ArrowRight, Github } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const DownloadSection = () => {
  const handleDownload = (platform: string) => {
    toast({
      title: "Download Started",
      description: `FloatCalci for ${platform} is being downloaded. Please check your downloads folder.`,
      duration: 5000,
    });
  };

  return (
    <section id="download" className="py-24 relative overflow-hidden">
      <div className="absolute top-40 left-[15%] w-64 h-64 rounded-full bg-brand-blue/10 filter blur-3xl"></div>
      <div className="absolute bottom-20 right-[10%] w-72 h-72 rounded-full bg-brand-purple-light/10 filter blur-3xl"></div>

      <div className="container px-4 md:px-6 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-block mb-4">
            <span className="inline-flex items-center rounded-full border border-brand-blue/20 bg-brand-blue/10 px-3 py-1 text-sm font-medium text-brand-blue">
              Available for macOS
            </span>
          </div>

          <AnimatedText
            text="Download and Try FloatCalci Today"
            element="h2"
            animation="fade-in-up"
            className="text-3xl md:text-4xl font-bold tracking-tight text-balance mb-4"
          />

          <AnimatedText
            text="Get started with our beta version and experience the future of calculator apps. Installation is quick and easy."
            element="p"
            animation="fade-in-up"
            delay={100}
            className="text-lg text-muted-foreground"
          />
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          <GlassCard className="p-6 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
            <div className="flex flex-col h-full">
              <div className="bg-brand-blue/10 p-4 rounded-lg inline-flex self-start mb-4">
                <Download className="h-6 w-6 text-brand-blue" />
              </div>

              <h3 className="text-xl font-semibold mb-3">Download Beta</h3>
              <p className="text-muted-foreground mb-6 flex-grow">
                Download our beta version to experience FloatCalci firsthand. Available for macOS 11 (Big Sur) and newer.
              </p>

              <div className="space-y-4 mt-auto">
                <Button
                  className="w-full bg-brand-blue hover:bg-brand-blue/90 text-white"
                  onClick={() => handleDownload("macOS (Intel)")}
                >
                  Download for macOS (Intel)
                </Button>
                <Button
                  className="w-full bg-brand-blue hover:bg-brand-blue/90 text-white"
                  onClick={() => handleDownload("macOS (Apple Silicon)")}
                >
                  Download for macOS (Apple Silicon)
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  Version 0.9.2 beta • Released May 15, 2023
                </p>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-6 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
            <div className="flex flex-col h-full">
              <div className="bg-brand-purple-light/10 p-4 rounded-lg inline-flex self-start mb-4">
                <Github className="h-6 w-6 text-brand-purple-dark" />
              </div>

              <h3 className="text-xl font-semibold mb-3">Build from Source</h3>
              <p className="text-muted-foreground mb-4 flex-grow">
                For developers who want to explore the code or contribute to the project, you can build FloatCalci from source.
              </p>

              <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 mb-6 font-mono text-sm overflow-auto">
                <p className="mb-1"># Clone the repository</p>
                <p className="text-brand-blue mb-3">git clone https://github.com/floatcalci/floatcalci.git</p>
                <p className="mb-1"># Install dependencies</p>
                <p className="text-brand-blue mb-3">pip install -r requirements.txt</p>
                <p className="mb-1"># Build the application</p>
                <p className="text-brand-blue">python build.py</p>
              </div>

              <Button
                variant="outline"
                className="w-full group mt-auto"
                onClick={() => window.open("https://github.com/floatcalci/floatcalci", "_blank")}
              >
                View Source on GitHub
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </div>
          </GlassCard>
        </div>

        <div className="mt-16 max-w-3xl mx-auto text-center animate-fade-in-up" style={{ animationDelay: '400ms' }}>
          <h3 className="text-xl font-semibold mb-4">System Requirements</h3>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <div className="flex items-center gap-2">
              <Laptop className="h-5 w-5 text-brand-blue" />
              <span>macOS 11 (Big Sur) or newer</span>
            </div>
            <div className="hidden sm:block">•</div>
            <div>2GB RAM minimum</div>
            <div className="hidden sm:block">•</div>
            <div>500MB free disk space</div>
          </div>

          <p className="mt-8 text-sm text-muted-foreground">
            Having issues with the installation? <a href="#" className="text-brand-blue hover:underline">Check our troubleshooting guide</a> or <a href="#" className="text-brand-blue hover:underline">contact support</a>.
          </p>
        </div>
      </div>
    </section>
  );
};

export default DownloadSection;
