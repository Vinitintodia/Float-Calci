
import React from 'react';
import { useUser } from "@clerk/clerk-react";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';
import GlassCard from '@/components/ui-custom/GlassCard';

const Profile = () => {
  const { user, isSignedIn, isLoaded } = useUser();

  // Show loading state while Clerk loads
  if (!isLoaded) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  // Redirect to home if not signed in
  if (!isSignedIn) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-white">
      <NavBar />
      
      <main className="container mx-auto px-4 pt-32 pb-20">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Your Profile</h1>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-1">
              <GlassCard className="p-6">
                <div className="flex flex-col items-center">
                  <div className="w-24 h-24 rounded-full overflow-hidden mb-4">
                    <img 
                      src={user?.imageUrl} 
                      alt={user?.fullName || 'User'} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <h2 className="text-xl font-semibold">{user?.fullName}</h2>
                  <p className="text-muted-foreground">{user?.primaryEmailAddress?.emailAddress}</p>
                </div>
              </GlassCard>
            </div>
            
            <div className="md:col-span-2">
              <GlassCard className="p-6">
                <h3 className="text-lg font-semibold mb-4">Account Settings</h3>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-1">Email Address</h4>
                    <p className="text-muted-foreground">{user?.primaryEmailAddress?.emailAddress}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-1">Account Created</h4>
                    <p className="text-muted-foreground">
                      {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-1">Subscription Status</h4>
                    <div className="flex items-center">
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                        Beta Access
                      </span>
                    </div>
                  </div>
                  
                  <div className="pt-4">
                    <Button variant="outline" className="mr-2">
                      Manage Account
                    </Button>
                    <Button variant="destructive">
                      Sign Out
                    </Button>
                  </div>
                </div>
              </GlassCard>
              
              <GlassCard className="p-6 mt-6">
                <h3 className="text-lg font-semibold mb-4">App Preferences</h3>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-1">Voice Settings</h4>
                    <p className="text-muted-foreground">Customize your voice recognition preferences.</p>
                    <Button variant="outline" size="sm" className="mt-2">
                      Configure
                    </Button>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-1">Calculation History</h4>
                    <p className="text-muted-foreground">View and manage your calculation history.</p>
                    <Button variant="outline" size="sm" className="mt-2">
                      View History
                    </Button>
                  </div>
                </div>
              </GlassCard>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Profile;
