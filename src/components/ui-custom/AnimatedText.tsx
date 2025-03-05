
import React from 'react';
import { cn } from "@/lib/utils";

interface AnimatedTextProps {
  text: string;
  className?: string;
  element?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span';
  animation?: 'fade-in' | 'fade-in-up' | 'fade-in-right' | 'blur-in';
  delay?: number; // Base delay in ms
  staggerChildren?: boolean;
  gradient?: boolean;
}

const AnimatedText = ({ 
  text, 
  className, 
  element = 'p',
  animation = 'fade-in',
  delay = 0,
  staggerChildren = false,
  gradient = false,
}: AnimatedTextProps) => {
  
  const animationClass = `animate-${animation}`;
  const Container = element;
  
  if (!staggerChildren) {
    return (
      <Container 
        className={cn(
          animationClass,
          gradient ? 'text-gradient' : '',
          className
        )}
        style={{ animationDelay: `${delay}ms` }}
      >
        {text}
      </Container>
    );
  }
  
  // Stagger animation for each word
  const words = text.split(' ');
  
  return (
    <Container className={cn(className, gradient ? 'text-gradient' : '')}>
      {words.map((word, index) => (
        <span 
          key={index} 
          className={animationClass}
          style={{ 
            animationDelay: `${delay + (index * 75)}ms`, 
            display: 'inline-block',
            marginRight: '0.25em'
          }}
        >
          {word}
        </span>
      ))}
    </Container>
  );
};

export default AnimatedText;
