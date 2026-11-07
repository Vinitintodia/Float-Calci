
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import GlassCard from "@/components/ui-custom/GlassCard";
import AnimatedText from "@/components/ui-custom/AnimatedText";
import { Calculator, BarChart3, Calculator as CalculatorIcon, Watch } from "lucide-react";

const voiceCommands = [
  { command: "Add twenty plus fifteen", result: "35" },
  { command: "Multiply eight by seven", result: "56" },
  { command: "What's five percent of two hundred", result: "10" },
  { command: "Square root of sixty-four", result: "8" },
  { command: "Four to the power of three", result: "64" }
];

const AppDemo = () => {
  const [activeCommand, setActiveCommand] = useState(0);
  
  // Change active command every 4 seconds
  React.useEffect(() => {
    const interval = setInterval(() => {
      setActiveCommand((prev) => (prev + 1) % voiceCommands.length);
    }, 4000);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <section id="demo" className="py-20 bg-brand-gray-light/30 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-20 bg-gradient-to-b from-background to-transparent"></div>
      <div className="absolute bottom-0 left-0 w-full h-20 bg-gradient-to-t from-background to-transparent"></div>
      
      <div className="container px-4 md:px-6 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-block mb-4">
            <span className="inline-flex items-center rounded-full border border-brand-blue/20 bg-brand-blue/10 px-3 py-1 text-sm font-medium text-brand-blue">
              Experience VocieCal
            </span>
          </div>
          
          <AnimatedText
            text="Intuitive Design for Every Calculation Need"
            element="h2"
            animation="fade-in-up"
            className="text-3xl md:text-4xl font-bold tracking-tight text-balance mb-4"
          />
          
          <AnimatedText
            text="Switch between different calculator modes and see how the interface adapts to your needs."
            element="p"
            animation="fade-in-up"
            delay={100}
            className="text-lg text-muted-foreground"
          />
        </div>
        
        <div className="max-w-4xl mx-auto">
          <Tabs defaultValue="basic" className="w-full">
            <div className="flex justify-center mb-8">
              <TabsList className="grid w-full max-w-md grid-cols-4">
                <TabsTrigger value="basic" className="flex items-center gap-2">
                  <CalculatorIcon className="h-4 w-4" />
                  <span>Basic</span>
                </TabsTrigger>
                <TabsTrigger value="scientific" className="flex items-center gap-2">
                  <Calculator className="h-4 w-4" />
                  <span>Scientific</span>
                </TabsTrigger>
                <TabsTrigger value="financial" className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  <span>Financial</span>
                </TabsTrigger>
                <TabsTrigger value="watch" className="flex items-center gap-2">
                  <Watch className="h-4 w-4" />
                  <span>Watch</span>
                </TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="basic" className="animate-fade-in">
              <GlassCard intensity="high" className="overflow-hidden shadow-xl">
                <div className="aspect-video bg-brand-gray-dark/5 relative">
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[300px] sm:w-[360px]">
                    <div className="bg-card rounded-xl shadow-2xl overflow-hidden border border-border">
                      <div className="h-12 bg-brand-gray-light border-b border-border flex items-center justify-between px-4">
                        <div className="text-sm font-medium text-brand-gray-dark">Basic Calculator</div>
                        <div className="flex space-x-2">
                          <div className="w-2.5 h-2.5 rounded-full bg-red-400"></div>
                          <div className="w-2.5 h-2.5 rounded-full bg-yellow-400"></div>
                          <div className="w-2.5 h-2.5 rounded-full bg-green-400"></div>
                        </div>
                      </div>
                      
                      <div className="p-4">
                        <div className="text-right text-3xl font-light mb-6 font-mono">
                          {voiceCommands[activeCommand].result}
                        </div>
                        
                        <div className="grid grid-cols-4 gap-2">
                          {["C", "±", "%", "÷", "7", "8", "9", "×", "4", "5", "6", "-", "1", "2", "3", "+", "0", ".", "="].map((key, index) => (
                            <div 
                              key={index}
                              className={`h-10 rounded-lg flex items-center justify-center text-base ${
                                ["C", "±", "%", "÷", "×", "-", "+", "="].includes(key) 
                                  ? "bg-brand-blue text-white" 
                                  : "bg-brand-gray-light/60 text-brand-gray-dark"
                              }`}
                            >
                              {key}
                            </div>
                          ))}
                        </div>
                        
                        <div className="mt-6 p-3 bg-brand-gray-light/50 rounded-lg animate-pulse-subtle">
                          <div className="flex items-center">
                            <div className="w-8 h-8 rounded-full bg-brand-blue/20 flex items-center justify-center text-brand-blue text-xs">
                              🎤
                            </div>
                            <div className="ml-3 text-sm text-brand-gray-medium font-mono">
                              "{voiceCommands[activeCommand].command}"
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Animated cursor */}
                  <div className="absolute bottom-10 right-[40%] w-6 h-6 border-2 border-brand-gray-dark rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-brand-blue rounded-full"></div>
                  </div>
                </div>
              </GlassCard>
            </TabsContent>
            
            <TabsContent value="scientific" className="animate-fade-in">
              <GlassCard intensity="high" className="overflow-hidden shadow-xl">
                <div className="aspect-video bg-brand-gray-dark/5 relative">
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[300px] sm:w-[360px]">
                    <div className="bg-card rounded-xl shadow-2xl overflow-hidden border border-border">
                      <div className="h-12 bg-brand-gray-light border-b border-border flex items-center justify-between px-4">
                        <div className="text-sm font-medium text-brand-gray-dark">Scientific Calculator</div>
                        <div className="flex space-x-2">
                          <div className="w-2.5 h-2.5 rounded-full bg-red-400"></div>
                          <div className="w-2.5 h-2.5 rounded-full bg-yellow-400"></div>
                          <div className="w-2.5 h-2.5 rounded-full bg-green-400"></div>
                        </div>
                      </div>
                      
                      <div className="p-4">
                        <div className="text-right text-2xl font-light mb-4 font-mono">
                          sin(30°) = 0.5
                        </div>
                        
                        <div className="grid grid-cols-5 gap-1.5 mb-2">
                          {["2nd", "x²", "x³", "xʸ", "eˣ", "sin", "cos", "tan", "log", "ln", "π", "(", ")", "C", "DEL"].map((key, index) => (
                            <div 
                              key={index}
                              className="h-8 rounded flex items-center justify-center text-xs bg-brand-purple-light/50 text-brand-purple-dark"
                            >
                              {key}
                            </div>
                          ))}
                        </div>
                        
                        <div className="grid grid-cols-4 gap-1.5">
                          {["7", "8", "9", "÷", "4", "5", "6", "×", "1", "2", "3", "-", "0", ".", "=", "+"].map((key, index) => (
                            <div 
                              key={index}
                              className={`h-8 rounded flex items-center justify-center text-sm ${
                                ["÷", "×", "-", "+", "="].includes(key) 
                                  ? "bg-brand-blue text-white" 
                                  : "bg-brand-gray-light/60 text-brand-gray-dark"
                              }`}
                            >
                              {key}
                            </div>
                          ))}
                        </div>
                        
                        <div className="mt-4 p-3 bg-brand-gray-light/50 rounded-lg animate-pulse-subtle">
                          <div className="flex items-center">
                            <div className="w-7 h-7 rounded-full bg-brand-blue/20 flex items-center justify-center text-brand-blue text-xs">
                              🎤
                            </div>
                            <div className="ml-3 text-xs text-brand-gray-medium font-mono">
                              "Calculate sine of thirty degrees"
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </GlassCard>
            </TabsContent>
            
            <TabsContent value="financial" className="animate-fade-in">
              <GlassCard intensity="high" className="overflow-hidden shadow-xl">
                <div className="aspect-video bg-brand-gray-dark/5 relative">
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[300px] sm:w-[360px]">
                    <div className="bg-card rounded-xl shadow-2xl overflow-hidden border border-border">
                      <div className="h-12 bg-brand-gray-light border-b border-border flex items-center justify-between px-4">
                        <div className="text-sm font-medium text-brand-gray-dark">Financial Calculator</div>
                        <div className="flex space-x-2">
                          <div className="w-2.5 h-2.5 rounded-full bg-red-400"></div>
                          <div className="w-2.5 h-2.5 rounded-full bg-yellow-400"></div>
                          <div className="w-2.5 h-2.5 rounded-full bg-green-400"></div>
                        </div>
                      </div>
                      
                      <div className="p-4">
                        <div className="text-right text-xl font-light mb-4 font-mono">
                          Future Value: $12,936.53
                        </div>
                        
                        <div className="space-y-2 mb-4">
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="bg-brand-gray-light/40 p-2 rounded">Principal: $10,000</div>
                            <div className="bg-brand-gray-light/40 p-2 rounded">Rate: 5.25%</div>
                            <div className="bg-brand-gray-light/40 p-2 rounded">Time: 5 years</div>
                            <div className="bg-brand-gray-light/40 p-2 rounded">Compound: Annually</div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 mb-3">
                          {["Calculate", "Reset", "Save", "History"].map((key, index) => (
                            <div 
                              key={index}
                              className={`h-8 rounded-lg flex items-center justify-center text-xs ${
                                index === 0 
                                  ? "bg-brand-blue text-white" 
                                  : "bg-brand-gray-light/60 text-brand-gray-dark"
                              }`}
                            >
                              {key}
                            </div>
                          ))}
                        </div>
                        
                        <div className="mt-2 p-3 bg-brand-gray-light/50 rounded-lg animate-pulse-subtle">
                          <div className="flex items-center">
                            <div className="w-7 h-7 rounded-full bg-brand-blue/20 flex items-center justify-center text-brand-blue text-xs">
                              🎤
                            </div>
                            <div className="ml-3 text-xs text-brand-gray-medium font-mono">
                              "Calculate compound interest for $10,000 at 5.25% for 5 years"
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </GlassCard>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </section>
  );
};

export default AppDemo;
